from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class LicenseResult(BaseModel):
    region: str
    status: str       # "public_domain", "creative_commons", "protected", "unknown"
    rule: str
    confidence: str   # "high", "medium", "low"
    evidence: Dict[str, Any]


class LicenseEngine:
    """
    Motor determinístico de avaliação de direitos autorais para obras audiovisuais.
    Regras estritas e auditáveis baseadas nas legislações regionais.
    """

    @classmethod
    def evaluate(
        cls,
        year: Optional[int],
        region: str = "BR",
        is_cc: bool = False,
        people: Optional[Dict[str, Any]] = None,
        wikidata_evidence: Optional[Dict[str, Any]] = None,
        reference_year: Optional[int] = None
    ) -> LicenseResult:
        if reference_year is None:
            reference_year = datetime.now(timezone.utc).year

        region = region.upper()
        evidence: Dict[str, Any] = {
            "evaluated_at_year": reference_year,
            "release_year": year,
            "region": region,
        }

        # 1. Licenças Abertas Universais (Creative Commons, etc.)
        if is_cc:
            return LicenseResult(
                region=region,
                status="creative_commons",
                rule="cc_open_license",
                confidence="high",
                evidence=evidence
            )

        if year is None:
            return LicenseResult(
                region=region,
                status="unknown",
                rule="missing_release_year",
                confidence="low",
                evidence=evidence
            )

        # 2. BRASIL: Lei nº 9.610/1998, Art. 44 (Audiovisual: 70 anos pós-divulgação)
        # Contagem a partir de 1º de janeiro do ano subsequente.
        # Exemplo em 2026: 2026 - 71 = 1955. Filmes lançados até 1955 estão livres.
        if region == "BR":
            br_threshold = reference_year - 71
            evidence["br_cutoff_year"] = br_threshold

            if year <= br_threshold:
                return LicenseResult(
                    region="BR",
                    status="public_domain",
                    rule="lei_9610_art_44_audiovisual",
                    confidence="high",
                    evidence=evidence
                )
            else:
                return LicenseResult(
                    region="BR",
                    status="protected",
                    rule="lei_9610_art_44_still_protected",
                    confidence="high",
                    evidence=evidence
                )

        # 3. ESTADOS UNIDOS: Obras publicadas até 1930 (em 2026) estão em domínio público
        if region == "US":
            us_threshold = reference_year - 96
            evidence["us_cutoff_year"] = us_threshold

            if year <= us_threshold:
                return LicenseResult(
                    region="US",
                    status="public_domain",
                    rule="us_pre_1931_public_domain",
                    confidence="high",
                    evidence=evidence
                )
            
            # Obras de 1931 a 1963 cujo copyright não foi renovado
            if wikidata_evidence and wikidata_evidence.get("us_non_renewal_verified"):
                evidence["non_renewal_source"] = wikidata_evidence.get("source")
                return LicenseResult(
                    region="US",
                    status="public_domain",
                    rule="us_1931_1963_non_renewed",
                    confidence="medium",
                    evidence=evidence
                )

            return LicenseResult(
                region="US",
                status="protected",
                rule="us_protected_term",
                confidence="medium",
                evidence=evidence
            )

        # 4. UNIÃO EUROPEIA: Vida do último sobrevivente (diretor/roteirista/compositor) + 70 anos
        if region in ("EU", "PT", "ES", "FR", "DE", "IT"):
            if not people or not people.get("authors_death_years"):
                evidence["notice"] = "Datas de falecimento dos coautores não localizadas no Wikidata"
                return LicenseResult(
                    region=region,
                    status="unknown",
                    rule="eu_missing_authors_death_dates",
                    confidence="low",
                    evidence=evidence
                )

            death_years = people["authors_death_years"]
            last_death = max(death_years)
            eu_threshold = reference_year - 71
            evidence["last_author_death_year"] = last_death
            evidence["eu_cutoff_year"] = eu_threshold

            if last_death <= eu_threshold:
                return LicenseResult(
                    region=region,
                    status="public_domain",
                    rule="eu_life_plus_70_expired",
                    confidence="high",
                    evidence=evidence
                )
            else:
                return LicenseResult(
                    region=region,
                    status="protected",
                    rule="eu_life_plus_70_active",
                    confidence="high",
                    evidence=evidence
                )

        # Default fallback para outras regiões
        return LicenseResult(
            region=region,
            status="unknown",
            rule="unsupported_region",
            confidence="low",
            evidence=evidence
        )
