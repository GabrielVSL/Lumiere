import pytest
from app.services.license_engine import LicenseEngine


def test_nosferatu_1922_brazil_and_us():
    # Em 2026: 1922 tem mais de 70 anos de divulgação (BR) e é anterior a 1931 (US)
    res_br = LicenseEngine.evaluate(year=1922, region="BR", reference_year=2026)
    assert res_br.status == "public_domain"
    assert res_br.rule == "lei_9610_art_44_audiovisual"
    assert res_br.confidence == "high"

    res_us = LicenseEngine.evaluate(year=1922, region="US", reference_year=2026)
    assert res_us.status == "public_domain"
    assert res_us.rule == "us_pre_1931_public_domain"


def test_night_of_the_living_dead_1968_protected_in_brazil():
    # 1968 nos EUA é domínio público por falta de aviso de copyright,
    # MAS no Brasil é PROTEGIDO até 2039 (1968 + 70 anos a partir de 1969)
    res_br = LicenseEngine.evaluate(year=1968, region="BR", reference_year=2026)
    assert res_br.status == "protected"
    assert res_br.rule == "lei_9610_art_44_still_protected"

    # Nos EUA com evidência de não-renovação
    res_us = LicenseEngine.evaluate(
        year=1968,
        region="US",
        wikidata_evidence={"us_non_renewal_verified": True, "source": "US Copyright Office"},
        reference_year=2026
    )
    assert res_us.status == "public_domain"
    assert res_us.rule == "us_1931_1963_non_renewed"


def test_metropolis_1927_brazil_vs_eu():
    # Metropolis é 1927. No Brasil (divulgação), está em domínio público desde 1998.
    res_br = LicenseEngine.evaluate(year=1927, region="BR", reference_year=2026)
    assert res_br.status == "public_domain"

    # Na Europa (morte do diretor Fritz Lang em 1976 -> 1976 + 70 anos = 2046) -> PROTEGIDO
    res_eu = LicenseEngine.evaluate(
        year=1927,
        region="EU",
        people={"authors_death_years": [1976]},
        reference_year=2026
    )
    assert res_eu.status == "protected"
    assert res_eu.rule == "eu_life_plus_70_active"


def test_creative_commons_universal():
    res_br = LicenseEngine.evaluate(year=2015, region="BR", is_cc=True, reference_year=2026)
    assert res_br.status == "creative_commons"
    assert res_br.confidence == "high"

    res_eu = LicenseEngine.evaluate(year=2015, region="EU", is_cc=True, reference_year=2026)
    assert res_eu.status == "creative_commons"
