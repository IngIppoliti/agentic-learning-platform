from typing import Dict, Any, List, Optional, Union
import asyncio
import structlog
from datetime import datetime
import openai
import anthropic
from tenacity import retry, stop_after_attempt, wait_exponential
from app.core.config import settings
import json
import tiktoken

logger = structlog.get_logger(__name__)

class LLMService:
    """
    Servizio centralizzato per gestione LLM multipli
    """
    
    def __init__(self):
        # Configurazione client
        self.openai_client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.anthropic_client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        
        # Configurazione modelli
        self.model_configs = {
            "gpt-4-turbo": {
                "provider": "openai",
                "max_tokens": 4096,
                "cost_per_1k_tokens": 0.03,
                "context_window": 128000,
                "strengths": ["reasoning", "code", "analysis"]
            },
            "gpt-3.5-turbo": {
                "provider": "openai",
                "max_tokens": 4096,
                "cost_per_1k_tokens": 0.002,
                "context_window": 16385,
                "strengths": ["fast", "cheap", "general"]
            },
            "claude-3-5-sonnet-20241022": {
                "provider": "anthropic",
                "max_tokens": 4096,
                "cost_per_1k_tokens": 0.03,
                "context_window": 200000,
                "strengths": ["reasoning", "analysis", "structured_output"]
            },
            "claude-3-haiku-20240307": {
                "provider": "anthropic",
                "max_tokens": 4096,
                "cost_per_1k_tokens": 0.0025,
                "context_window": 200000,
                "strengths": ["fast", "cheap", "simple_tasks"]
            }
        }
        
        # Tokenizer per conteggio
        self.tokenizer = tiktoken.get_encoding("cl100k_base")
        
        # Cache per risposte
        self.response_cache = {}
        
        # Metriche
        self.usage_stats = {
            "total_requests": 0,
            "total_tokens": 0,
            "total_cost": 0.0,
            "model_usage": {}
        }
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    async def generate_completion(
        self,
        prompt: str,
        model: str = "gpt-4-turbo",
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        system_prompt: Optional[str] = None,
        format_json: bool = False,
        cache_key: Optional[str] = None
    ) -> str:
        """
        Genera completion con retry automatico e caching
        """
        start_time = datetime.now()
        
        # Controlla cache
        if cache_key and cache_key in self.response_cache:
            logger.info("cache_hit", cache_key=cache_key, model=model)
            return self.response_cache[cache_key]
        
        # Valida modello
        if model not in self.model_configs:
            raise ValueError(f"Unknown model: {model}")
        
        config = self.model_configs[model]
        provider = config["provider"]
        
        # Stima token
        prompt_tokens = len(self.tokenizer.encode(prompt))
        if system_prompt:
            prompt_tokens += len(self.tokenizer.encode(system_prompt))
        
        # Controlla limiti
        if prompt_tokens > config["context_window"] * 0.8:  # Lascia margine per risposta
            raise ValueError(f"Prompt too long: {prompt_tokens} tokens for model {model}")
        
        # Set default max_tokens
        if max_tokens is None:
            max_tokens = min(config["max_tokens"], 
                           config["context_window"] - prompt_tokens - 100)
        
        try:
            # Routing per provider
            if provider == "openai":
                response = await self._call_openai(
                    prompt, model, temperature, max_tokens, system_prompt, format_json
                )
            elif provider == "anthropic":
                response = await self._call_anthropic(
                    prompt, model, temperature, max_tokens, system_prompt
                )
            else:
                raise ValueError(f"Unknown provider: {provider}")
            
            # Aggiorna statistiche
            execution_time = (datetime.now() - start_time).total_seconds()
            await self._update_usage_stats(model, prompt_tokens, len(response), execution_time)
            
            # Cache se richiesto
            if cache_key:
                self.response_cache[cache_key] = response
            
            logger.info(
                "llm_completion_success",
                model=model,
                prompt_tokens=prompt_tokens,
                response_length=len(response),
                execution_time=execution_time
            )
            
            return response
            
        except Exception as e:
            logger.error(
                "llm_completion_error",
                model=model,
                error=str(e),
                prompt_preview=prompt[:100]
            )
            raise
    
    async def _call_openai(
        self,
        prompt: str,
        model: str,
        temperature: float,
        max_tokens: int,
        system_prompt: Optional[str],
        format_json: bool
    ) -> str:
        """Chiamata a modelli OpenAI"""
        messages = []
        
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        
        messages.append({"role": "user", "content": prompt})
        
        kwargs = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        
        if format_json:
            kwargs["response_format"] = {"type": "json_object"}
        
        response = await self.openai_client.chat.completions.create(**kwargs)
        return response.choices[0].message.content
    
    async def _call_anthropic(
        self,
        prompt: str,
        model: str,
        temperature: float,
        max_tokens: int,
        system_prompt: Optional[str]
    ) -> str:
        """Chiamata a modelli Anthropic"""
        kwargs = {
            "model": model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": [{"role": "user", "content": prompt}]
        }
        
        if system_prompt:
            kwargs["system"] = system_prompt
        
        response = await self.anthropic_client.messages.create(**kwargs)
        
        # Anthropic restituisce lista di content blocks
        return response.content[0].text
    
    async def _update_usage_stats(self, model: str, input_tokens: int, output_length: int, execution_time: float):
        """Aggiorna statistiche di utilizzo"""
        # Stima token output (approssimativo)
        output_tokens = len(self.tokenizer.encode(str(output_length))) if output_length else 0
        total_tokens = input_tokens + output_tokens
        
        # Calcola costo
        cost_per_token = self.model_configs[model]["cost_per_1k_tokens"] / 1000
        cost = total_tokens * cost_per_token
        
        # Aggiorna stats
        self.usage_stats["total_requests"] += 1
        self.usage_stats["total_tokens"] += total_tokens
        self.usage_stats["total_cost"] += cost
        
        if model not in self.usage_stats["model_usage"]:
            self.usage_stats["model_usage"][model] = {
                "requests": 0,
                "tokens": 0,
                "cost": 0.0,
                "avg_execution_time": 0.0
            }
        
        model_stats = self.usage_stats["model_usage"][model]
        model_stats["requests"] += 1
        model_stats["tokens"] += total_tokens
        model_stats["cost"] += cost
        
        # Media mobile per execution time
        current_avg = model_stats["avg_execution_time"]
        model_stats["avg_execution_time"] = (
            (current_avg * (model_stats["requests"] - 1) + execution_time) / model_stats["requests"]
        )
    
    async def batch_generate(
        self,
        prompts: List[str],
        model: str = "gpt-3.5-turbo",
        temperature: float = 0.7,
        max_concurrent: int = 5
    ) -> List[str]:
        """
        Generazione batch con controllo concorrenza
        """
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def generate_with_semaphore(prompt: str) -> str:
            async with semaphore:
                return await self.generate_completion(prompt, model, temperature)
        
        tasks = [generate_with_semaphore(prompt) for prompt in prompts]
        return await asyncio.gather(*tasks)
    
    def recommend_model(self, task_type: str, complexity: str = "medium") -> str:
        """
        Raccomanda il modello migliore per un tipo di task
        """
        recommendations = {
            "reasoning": {
                "simple": "claude-3-haiku-20240307",
                "medium": "gpt-4-turbo",
                "complex": "claude-3-5-sonnet-20241022"
            },
            "code": {
                "simple": "gpt-3.5-turbo",
                "medium": "gpt-4-turbo",
                "complex": "gpt-4-turbo"
            },
            "analysis": {
                "simple": "gpt-3.5-turbo",
                "medium": "claude-3-5-sonnet-20241022",
                "complex": "claude-3-5-sonnet-20241022"
            },
            "creative": {
                "simple": "gpt-3.5-turbo",
                "medium": "gpt-4-turbo",
                "complex": "claude-3-5-sonnet-20241022"
            }
        }
        
        return recommendations.get(task_type, {}).get(complexity, "gpt-4-turbo")
    
    def get_usage_stats(self) -> Dict[str, Any]:
        """Restituisce statistiche di utilizzo"""
        return self.usage_stats.copy()
    
    def clear_cache(self) -> None:
        """Pulisce cache delle risposte"""
        self.response_cache.clear()
        logger.info("llm_cache_cleared")
