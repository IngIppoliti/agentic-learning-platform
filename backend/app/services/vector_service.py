

"""
Pinecone RAG Implementation - Sistema completo per:

🔍 Semantic Search con OpenAI embeddings
📊 Hybrid Search con filtri metadata
🔄 Batch Operations per performance
🎯 Content Similarity matching
📈 Reranking intelligente dei risultati
⚡ Namespaces per organizzazione (courses, content, skills, profiles)


Vector Service Features:
Multi-provider support (OpenAI embeddings)
Advanced filtering con metadata
Intelligent reranking con freshness bonus
Batch processing per scalabilità
Error handling robusto
Performance metrics con timing

"""

import asyncio
import openai
import pinecone
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import logging
import json
import numpy as np
from app.core.config import settings
from datetime import datetime

logger = logging.getLogger(__name__)

class VectorNamespace(Enum):
    COURSES = "courses"
    CONTENT = "content"
    SKILLS = "skills"
    USER_PROFILES = "user_profiles"

@dataclass
class VectorQuery:
    text: str
    namespace: VectorNamespace
    top_k: int = settings.VECTOR_SEARCH_TOP_K
    filter_metadata: Optional[Dict[str, Any]] = None
    include_metadata: bool = True
    include_values: bool = False

@dataclass
class VectorResult:
    id: str
    score: float
    metadata: Dict[str, Any]
    values: Optional[List[float]] = None

@dataclass
class VectorSearchResponse:
    results: List[VectorResult]
    total_results: int
    query_time_ms: float

class VectorService:
    """Service per operazioni con Pinecone Vector Database"""

    def __init__(self, pinecone_api_key: str, pinecone_environment: str, index_name: str, openai_api_key: str):
        self.pinecone_api_key = pinecone_api_key
        self.pinecone_environment = pinecone_environment
        self.index_name = index_name
        self.openai_client = openai.AsyncOpenAI(api_key=openai_api_key)
        self.index = None
        self._initialize_pinecone()

    def _initialize_pinecone(self):
        """Inizializza connessione Pinecone"""
        try:
            pinecone.init(
                api_key=self.pinecone_api_key,
                environment=self.pinecone_environment
            )
            self.index = pinecone.Index(self.index_name)
            logger.info(f"Pinecone initialized successfully with index: {self.index_name}")
        except Exception as e:
            logger.error(f"Failed to initialize Pinecone: {e}")
            raise

    async def generate_embedding(self, text: str, model: str = "text-embedding-ada-002") -> List[float]:
        """Genera embedding per il testo usando OpenAI"""
        try:
            response = await self.openai_client.embeddings.create(
                model=model,
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"Failed to generate embedding: {e}")
            raise

    async def upsert_vector(
        self, 
        vector_id: str, 
        text: str, 
        namespace: VectorNamespace,
        metadata: Dict[str, Any]
    ) -> bool:
        """Inserisce o aggiorna un vettore nell'index"""
        try:
            # Genera embedding
            embedding = await self.generate_embedding(text)

            # Aggiungi timestamp ai metadata
            metadata_with_timestamp = {
                **metadata,
                "created_at": datetime.utcnow().isoformat(),
                "text_content": text[:500]  # Prime 500 char per reference
            }

            # Upsert nel namespace specifico
            self.index.upsert(
                vectors=[(vector_id, embedding, metadata_with_timestamp)],
                namespace=namespace.value
            )

            logger.info(f"Vector upserted successfully: {vector_id} in namespace {namespace.value}")
            return True

        except Exception as e:
            logger.error(f"Failed to upsert vector {vector_id}: {e}")
            return False

    async def batch_upsert_vectors(
        self,
        vectors_data: List[Dict[str, Any]],
        namespace: VectorNamespace,
        batch_size: int = 100
    ) -> Dict[str, int]:
        """Batch upsert di multipli vettori"""
        try:
            successful = 0
            failed = 0

            for i in range(0, len(vectors_data), batch_size):
                batch = vectors_data[i:i + batch_size]
                vectors_to_upsert = []

                for vector_data in batch:
                    try:
                        embedding = await self.generate_embedding(vector_data["text"])
                        metadata = {
                            **vector_data.get("metadata", {}),
                            "created_at": datetime.utcnow().isoformat(),
                            "text_content": vector_data["text"][:500]
                        }

                        vectors_to_upsert.append((
                            vector_data["id"],
                            embedding,
                            metadata
                        ))

                    except Exception as e:
                        logger.error(f"Failed to process vector {vector_data.get('id', 'unknown')}: {e}")
                        failed += 1
                        continue

                if vectors_to_upsert:
                    self.index.upsert(
                        vectors=vectors_to_upsert,
                        namespace=namespace.value
                    )
                    successful += len(vectors_to_upsert)

            logger.info(f"Batch upsert completed: {successful} successful, {failed} failed")
            return {"successful": successful, "failed": failed}

        except Exception as e:
            logger.error(f"Batch upsert failed: {e}")
            raise

    async def semantic_search(self, query: VectorQuery) -> VectorSearchResponse:
        """Ricerca semantica nel vector database"""
        try:
            start_time = datetime.utcnow()

            # Genera embedding per la query
            query_embedding = await self.generate_embedding(query.text)

            # Esegui ricerca
            search_results = self.index.query(
                vector=query_embedding,
                top_k=query.top_k,
                namespace=query.namespace.value,
                filter=query.filter_metadata,
                include_metadata=query.include_metadata,
                include_values=query.include_values
            )

            # Processa risultati
            results = []
            for match in search_results.matches:
                result = VectorResult(
                    id=match.id,
                    score=match.score,
                    metadata=match.metadata or {},
                    values=match.values if query.include_values else None
                )
                results.append(result)

            end_time = datetime.utcnow()
            query_time_ms = (end_time - start_time).total_seconds() * 1000

            return VectorSearchResponse(
                results=results,
                total_results=len(results),
                query_time_ms=query_time_ms
            )

        except Exception as e:
            logger.error(f"Semantic search failed: {e}")
            raise

    async def hybrid_search(
        self,
        query_text: str,
        namespace: VectorNamespace,
        keyword_filters: Optional[List[str]] = None,
        metadata_filters: Optional[Dict[str, Any]] = None,
        top_k: int = None,
        rerank: bool = None
    ) -> VectorSearchResponse:
        """Ricerca ibrida che combina semantic search e filtri"""
        try:
                
            top_k = top_k or settings.VECTOR_SEARCH_TOP_K
            rerank = rerank if rerank is not None else settings.VECTOR_RERANK_ENABLED
            
            # Costruisci filtri combinati
            combined_filters = {}

            if keyword_filters:
                combined_filters["keywords"] = {"$in": keyword_filters}

            if metadata_filters:
                combined_filters.update(metadata_filters)

            # Esegui ricerca semantica
            query = VectorQuery(
                text=query_text,
                namespace=namespace,
                top_k=top_k * 2 if rerank else top_k,  # Prendi più risultati se rerank
                filter_metadata=combined_filters if combined_filters else None
            )

            search_response = await self.semantic_search(query)

            if rerank and len(search_response.results) > top_k:
                # Re-rank risultati basato su relevance score e metadata
                reranked_results = self._rerank_results(
                    search_response.results, 
                    query_text, 
                    top_k
                )
                search_response.results = reranked_results
                search_response.total_results = len(reranked_results)

            return search_response

        except Exception as e:
            logger.error(f"Hybrid search failed: {e}")
            raise

    def _rerank_results(self, results: List[VectorResult], query_text: str, top_k: int) -> List[VectorResult]:
        """Re-rank risultati usando multiple signals"""
        try:
            scored_results = []

            for result in results:
                # Score base dalla similarity
                base_score = result.score

                # Bonus per metadata relevance
                metadata_bonus = 0
                if result.metadata:
                    # Bonus per freshness
                    if "created_at" in result.metadata:
                        try:
                            created_date = datetime.fromisoformat(result.metadata["created_at"].replace('Z', '+00:00'))
                            days_old = (datetime.utcnow() - created_date.replace(tzinfo=None)).days
                            freshness_bonus = max(0, (30 - days_old) / 30) * 0.1  # Max 0.1 bonus
                            metadata_bonus += freshness_bonus
                        except:
                            pass

                    # Bonus per content type
                    if result.metadata.get("content_type") == "course":
                        metadata_bonus += 0.05
                    elif result.metadata.get("content_type") == "exercise":
                        metadata_bonus += 0.03

                final_score = base_score + metadata_bonus
                scored_results.append((result, final_score))

            # Ordina per score finale e prendi top_k
            scored_results.sort(key=lambda x: x[1], reverse=True)
            return [result for result, _ in scored_results[:top_k]]

        except Exception as e:
            logger.error(f"Re-ranking failed: {e}")
            return results[:top_k]

    async def get_similar_content(
        self,
        content_id: str,
        namespace: VectorNamespace,
        top_k: int = 5,
        exclude_self: bool = True
    ) -> VectorSearchResponse:
        """Trova contenuti simili basato su un contenuto esistente"""
        try:
            # Recupera il vettore del contenuto originale
            fetch_response = self.index.fetch(
                ids=[content_id],
                namespace=namespace.value
            )

            if not fetch_response.vectors or content_id not in fetch_response.vectors:
                raise ValueError(f"Content {content_id} not found in namespace {namespace.value}")

            original_vector = fetch_response.vectors[content_id]

            # Cerca contenuti simili
            search_results = self.index.query(
                vector=original_vector.values,
                top_k=top_k + (1 if exclude_self else 0),
                namespace=namespace.value,
                include_metadata=True,
                include_values=False
            )

            # Processa risultati
            results = []
            for match in search_results.matches:
                if exclude_self and match.id == content_id:
                    continue

                result = VectorResult(
                    id=match.id,
                    score=match.score,
                    metadata=match.metadata or {}
                )
                results.append(result)

                if len(results) >= top_k:
                    break

            return VectorSearchResponse(
                results=results,
                total_results=len(results),
                query_time_ms=0  # Non misuriamo per questa operazione
            )

        except Exception as e:
            logger.error(f"Similar content search failed: {e}")
            raise

    async def delete_vector(self, vector_id: str, namespace: VectorNamespace) -> bool:
        """Elimina un vettore dall'index"""
        try:
            self.index.delete(
                ids=[vector_id],
                namespace=namespace.value
            )
            logger.info(f"Vector deleted successfully: {vector_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to delete vector {vector_id}: {e}")
            return False

    async def get_index_stats(self) -> Dict[str, Any]:
        """Recupera statistiche dell'index"""
        try:
            stats = self.index.describe_index_stats()
            return {
                "total_vector_count": stats.total_vector_count,
                "dimension": stats.dimension,
                "index_fullness": stats.index_fullness,
                "namespaces": {
                    name: {
                        "vector_count": ns.vector_count
                    } for name, ns in stats.namespaces.items()
                }
            }
        except Exception as e:
            logger.error(f"Failed to get index stats: {e}")
            raise
