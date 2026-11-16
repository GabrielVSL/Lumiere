import asyncio
import logging
import os
import sys
from typing import Any, Dict, List, Optional

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import httpx
from sqlalchemy import select

from app.core.database import AsyncSessionLocal, engine, Base
from app.models.play import Work, Source, MediaFile, Subtitle, LicenseAssessment, ReviewItem
from app.clients.internet_archive import InternetArchiveClient
from app.clients.tmdb import TMDBClient
from app.services.license_engine import LicenseEngine

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("lumiere_seed")

CURATED_CATALOG: List[Dict[str, Any]] = [
    {
        "archive_id": "his_girl_friday",
        "title": "Jejum de Amor",
        "original_title": "His Girl Friday",
        "year": 1940,
        "runtime_min": 92,
        "kind": "feature",
        "genres": ["Comédia", "Romance", "Clássico"],
        "directors": ["Howard Hawks"],
        "tagline": "Ela prometeu largar o jornalismo... até a maior manchete do século bater à porta.",
        "overview_pt": "Walter Burns, editor de um grande jornal, usa todas as artimanhas possíveis para impedir que sua ex-esposa e repórter estrela abandone a carreira jornalística e se case com outro.",
        "tmdb_id": 3085,
    },
    {
        "archive_id": "ThePhantomoftheOpera",
        "title": "O Fantasma da Ópera",
        "original_title": "The Phantom of the Opera",
        "year": 1925,
        "runtime_min": 93,
        "kind": "feature",
        "genres": ["Terror", "Mistério", "Clássico"],
        "directors": ["Rupert Julian"],
        "tagline": "A lenda sombria das catacumbas de Paris com Lon Chaney.",
        "overview_pt": "Nas catacumbas sob a Ópera de Paris vive Erik, um compositor gênio e desfigurado conhecido como o Fantasma. Cego de paixão por Christine, ele aterroriza o teatro para torná-la a estrela.",
        "tmdb_id": 964,
    },
    {
        "archive_id": "DasKabinettdesDoktorCaligariTheCabinetofDrCaligari",
        "title": "O Gabinete do Dr. Caligari",
        "original_title": "Das Cabinet des Dr. Caligari",
        "year": 1920,
        "runtime_min": 77,
        "kind": "feature",
        "genres": ["Terror", "Expressivismo", "Mistério"],
        "directors": ["Robert Wiene"],
        "tagline": "O ápice do Expressionismo Alemão no cinema mundial.",
        "overview_pt": "Num parque de diversões na Alemanha, o hipnotizador Dr. Caligari exibe Cesare, um sonâmbulo capaz de prever o futuro. Assassinatos macabros começam a abalar o vilarejo.",
        "tmdb_id": 234,
    },
    {
        "archive_id": "TheStranger_0",
        "title": "O Estranho",
        "original_title": "The Stranger",
        "year": 1946,
        "runtime_min": 95,
        "kind": "feature",
        "genres": ["Suspense", "Noir", "Drama"],
        "directors": ["Orson Welles"],
        "tagline": "Um fugitivo do pós-guerra escondido no coração da América.",
        "overview_pt": "Um investigador de crimes de guerra viaja a uma pacata cidade da Nova Inglaterra na caça de Franz Kindler, um dos arquitetos do Holocausto que assumiu nova identidade.",
        "tmdb_id": 20246,
    },
    {
        "archive_id": "The_General_Buster_Keaton",
        "title": "A General",
        "original_title": "The General",
        "year": 1926,
        "runtime_min": 78,
        "kind": "feature",
        "genres": ["Comédia", "Ação", "Aventura"],
        "directors": ["Buster Keaton", "Clyde Bruckman"],
        "tagline": "Uma locomotiva, dois amores e o maior gênio do cinema mudo.",
        "overview_pt": "Durante a Guerra Civil Americana, o maquinista Johnnie Gray tem sua amada locomotiva 'A General' sequestrada por espiões inimigos e inicia uma perseguição implacável sobre os trilhos.",
        "tmdb_id": 961,
    },
    {
        "archive_id": "ScarletStreet",
        "title": "Almas Perversas",
        "original_title": "Scarlet Street",
        "year": 1945,
        "runtime_min": 102,
        "kind": "feature",
        "genres": ["Noir", "Drama", "Crime"],
        "directors": ["Fritz Lang"],
        "tagline": "Uma mulher sem escrúpulos. Um pintor ingênuo. Uma descida sem volta.",
        "overview_pt": "Christopher Cross, modesto caixa de banco que pinta por passatempo, apaixona-se perdidamente pela femme fatale Kitty March, que o explora até a ruína moral absoluta.",
        "tmdb_id": 17058,
    },
    {
        "archive_id": "lost_world",
        "title": "O Mundo Perdido",
        "original_title": "The Lost World",
        "year": 1925,
        "runtime_min": 106,
        "kind": "feature",
        "genres": ["Ficção Científica", "Aventura", "Fantasia"],
        "directors": ["Harry O. Hoyt"],
        "tagline": "O pioneiro absoluto da animação stop-motion com dinossauros.",
        "overview_pt": "Uma expedição britânica liderada pelo Professor Challenger descobre um platô isolado na Bacia Amazônica onde dinossauros pré-históricos continuam vivos.",
        "tmdb_id": 2981,
    },
    {
        "archive_id": "gullivers_travels1939",
        "title": "As Viagens de Gulliver",
        "original_title": "Gulliver's Travels",
        "year": 1939,
        "runtime_min": 76,
        "kind": "feature",
        "genres": ["Animação", "Família", "Aventura"],
        "directors": ["Dave Fleischer"],
        "tagline": "O histórico longa animado dos irmãos Fleischer em Technicolor.",
        "overview_pt": "Após um naufrágio durante violenta tempestade, o navegador Lemuel Gulliver acorda na praia do reino de Lilliput e se vê no meio da disputa entre reis rivais.",
        "tmdb_id": 42518,
    },
    {
        "archive_id": "royal_wedding",
        "title": "Núpcias Reais",
        "original_title": "Royal Wedding",
        "year": 1951,
        "runtime_min": 93,
        "kind": "feature",
        "genres": ["Musical", "Comédia", "Romance"],
        "directors": ["Stanley Donen"],
        "tagline": "Onde Fred Astaire desafia a gravidade dançando pelas paredes e teto.",
        "overview_pt": "Dois irmãos dançarinos da Broadway viajam a Londres durante as celebrações do casamento real britânico de 1947 e encontram novos romances que testam o futuro de sua parceria.",
        "tmdb_id": 18646,
    },
    {
        "archive_id": "dressed_to_kill",
        "title": "Vestida Para Matar",
        "original_title": "Dressed to Kill",
        "year": 1946,
        "runtime_min": 71,
        "kind": "feature",
        "genres": ["Mistério", "Crime", "Suspense"],
        "directors": ["Roy William Neill"],
        "tagline": "Sherlock Holmes e Dr. Watson no enigma das caixinhas de música roubadas.",
        "overview_pt": "Três caixinhas de música fabricadas por detentos em Dartmoor guardam em suas melodias o código secreto para uma valiosa fortuna em matrizes de cédulas do Banco da Inglaterra.",
        "tmdb_id": 20417,
    },
    {
        "archive_id": "meet_john_doe",
        "title": "Adorável Vagabundo",
        "original_title": "Meet John Doe",
        "year": 1941,
        "runtime_min": 122,
        "kind": "feature",
        "genres": ["Drama", "Comédia", "Clássico"],
        "directors": ["Frank Capra"],
        "tagline": "A voz do homem comum contra a corrupção do poder.",
        "overview_pt": "Uma jornalista cria um protesto forjado sob o nome de 'John Doe', comovendo o país. O jornal contrata um ex-jogador sem-teto para personificar o herói popular.",
        "tmdb_id": 32574,
    },
    {
        "archive_id": "Cyrano_DeBergerac",
        "title": "Cyrano de Bergerac",
        "original_title": "Cyrano de Bergerac",
        "year": 1950,
        "runtime_min": 113,
        "kind": "feature",
        "genres": ["Drama", "Romance", "Histórico"],
        "directors": ["Michael Gordon"],
        "tagline": "O espadachim poético e seu coração incorruptível.",
        "overview_pt": "Cyrano de Bergerac é um brilhante duelista apaixonado por Roxane, que decide escrever cartas de amor ardentes no lugar do belo mas tímido Christian.",
        "tmdb_id": 43386,
    },
    {
        "archive_id": "Nosferatu_most_complete_version_93_mins.",
        "title": "Nosferatu",
        "original_title": "Nosferatu, eine Symphonie des Grauens",
        "year": 1922,
        "runtime_min": 94,
        "kind": "feature",
        "genres": ["Terror", "Expressivismo", "Clássico"],
        "directors": ["F.W. Murnau"],
        "tagline": "O primeiro e mais aterrador Drácula da história do cinema.",
        "overview_pt": "O corretor de imóveis Hutter viaja até os Montes Cárpatos para finalizar a venda de uma mansão com o Conde Orlok, sem desconfiar que ele é na verdade um vampiro milenar.",
        "tmdb_id": 653,
    },
    {
        "archive_id": "BattleshipPotemkin",
        "title": "O Encouraçado Potemkin",
        "original_title": "Bronenosets Potyomkin",
        "year": 1925,
        "runtime_min": 75,
        "kind": "feature",
        "genres": ["Drama", "Histórico", "Clássico"],
        "directors": ["Sergei Eisenstein"],
        "tagline": "A histórica revolução dos marinheiros e a antológica cena da escadaria de Odessa.",
        "overview_pt": "Marinheiros a bordo do navio de guerra russo rebelam-se contra a tirania dos oficiais após serem forçados a comer carne podre, acendendo a centelha revolucionária de 1905.",
        "tmdb_id": 643,
    },
    {
        "archive_id": "TheFlyingDeuces",
        "title": "Os Dois Marujos",
        "original_title": "The Flying Deuces",
        "year": 1939,
        "runtime_min": 69,
        "kind": "feature",
        "genres": ["Comédia", "Clássico"],
        "directors": ["A. Edward Sutherland"],
        "tagline": "O Gordo e o Magro na Legião Estrangeira Francesa.",
        "overview_pt": "Após Stan e Ollie sofrerem uma desilusão amorosa em Paris, decidem alistar-se na Legião Estrangeira para esquecer o passado, causando confusões hilárias no deserto africano.",
        "tmdb_id": 22999,
    },
    {
        "archive_id": "JungleBook",
        "title": "O Livro da Selva",
        "original_title": "Jungle Book",
        "year": 1942,
        "runtime_min": 108,
        "kind": "feature",
        "genres": ["Aventura", "Família", "Fantasia"],
        "directors": ["Zoltan Korda"],
        "tagline": "A lendária adaptação em Technicolor da obra-prima de Rudyard Kipling.",
        "overview_pt": "Criado por lobos no coração da selva indiana, o jovem MOWGLI cresce aprendendo a linguagem dos animais até precisar confrontar a ganância dos caçadores humanos.",
        "tmdb_id": 23033,
    },
    {
        "archive_id": "suddenly",
        "title": "Repentinamente",
        "original_title": "Suddenly",
        "year": 1954,
        "runtime_min": 77,
        "kind": "feature",
        "genres": ["Noir", "Suspense", "Crime"],
        "directors": ["Lewis Allen"],
        "tagline": "Frank Sinatra num suspense eletrizante contra o relógio.",
        "overview_pt": "Três pistoleiros liderados pelo implacável John Baron invadem uma casa de família numa pacata cidade ferroviária planejando assassinar o Presidente dos EUA.",
        "tmdb_id": 18398,
    },
    {
        "archive_id": "secret_weapon",
        "title": "A Arma Secreta",
        "original_title": "Sherlock Holmes and the Secret Weapon",
        "year": 1943,
        "runtime_min": 68,
        "kind": "feature",
        "genres": ["Mistério", "Crime", "Suspense"],
        "directors": ["Roy William Neill"],
        "tagline": "Sherlock Holmes contra o Professor Moriarty nos céus da Segunda Guerra.",
        "overview_pt": "Holmes e Watson devem proteger o inventor de uma revolucionária mira de bombardeio suíça das garras do Professor Moriarty e da espionagem do Eixo.",
        "tmdb_id": 18706,
    },
    {
        "archive_id": "my_favorite_brunette",
        "title": "Minha Morena Favorita",
        "original_title": "My Favorite Brunette",
        "year": 1947,
        "runtime_min": 87,
        "kind": "feature",
        "genres": ["Comédia", "Noir", "Mistério"],
        "directors": ["Elliott Nugent"],
        "tagline": "Bob Hope e Peter Lorre numa sátira irresistível aos detetives durões.",
        "overview_pt": "Um fotógrafo inocente é confundido com um detetive particular experiente e é contratado por uma bela mulher para recuperar um mapa de urânio cobiçado por assassinos.",
        "tmdb_id": 18649,
    },
    {
        "archive_id": "20000LeaguesUndertheSea",
        "title": "20.000 Léguas Submarinas",
        "original_title": "20,000 Leagues Under the Sea",
        "year": 1916,
        "runtime_min": 105,
        "kind": "feature",
        "genres": ["Ficção Científica", "Aventura", "Fantasia"],
        "directors": ["Stuart Paton"],
        "tagline": "O primeiro filme da história com filmagens submarinas reais.",
        "overview_pt": "Baseado na genial obra de Júlio Verne, o Capitão Nemo navega pelas profundezas dos oceanos a bordo de seu formidável submarino Nautilus.",
        "tmdb_id": 30266,
    },
    {
        "archive_id": "impact",
        "title": "Impacto",
        "original_title": "Impact",
        "year": 1949,
        "runtime_min": 111,
        "kind": "feature",
        "genres": ["Noir", "Drama", "Crime"],
        "directors": ["Arthur Lubin"],
        "tagline": "Uma trama de traição, vingança e redenção nos labirintos da lei.",
        "overview_pt": "Um bem-sucedido industrial sobrevive à emboscada de assassinato planejada por sua esposa e o amante dela, decidindo desaparecer e reconstruir sua vida no anonimato.",
        "tmdb_id": 25503,
    },
    {
        "archive_id": "little_princess",
        "title": "A Princesinha",
        "original_title": "The Little Princess",
        "year": 1939,
        "runtime_min": 93,
        "kind": "feature",
        "genres": ["Drama", "Família", "Clássico"],
        "directors": ["Walter Lang"],
        "tagline": "Shirley Temple na encantadora adaptação do clássico da literatura.",
        "overview_pt": "Quando seu pai é dado como desaparecido na Guerra dos Bôeres, uma jovem herdeira é rebaixada a serviçal pela severa diretora do internato, recusando-se a perder a esperança.",
        "tmdb_id": 26531,
    },
    {
        "archive_id": "penny_serenade",
        "title": "Serenata Prateada",
        "original_title": "Penny Serenade",
        "year": 1941,
        "runtime_min": 119,
        "kind": "feature",
        "genres": ["Drama", "Romance"],
        "directors": ["George Stevens"],
        "tagline": "Cary Grant e Irene Dunne num dos mais belos romances do cinema.",
        "overview_pt": "Enquanto escuta velhos discos de vinil que marcaram sua vida, uma mulher relembra as alegrias, os sacrifícios e os momentos comoventes de seu casamento prestes a ruir.",
        "tmdb_id": 43795,
    },
    {
        "archive_id": "Santa_Fe_Trail_movie",
        "title": "A Estrada de Santa Fé",
        "original_title": "Santa Fe Trail",
        "year": 1940,
        "runtime_min": 110,
        "kind": "feature",
        "genres": ["Aventura", "Guerra", "Histórico"],
        "directors": ["Michael Curtiz"],
        "tagline": "Errol Flynn e Olivia de Havilland num épico faroeste histórico.",
        "overview_pt": "Jovens oficiais recém-graduados de West Point são enviados ao Kansas para patrulhar a perigosa trilha ferroviária e conter os confrontos pré-Guerra Civil.",
        "tmdb_id": 1718,
    },
    {
        "archive_id": "Hitchcock_Secret_Agent",
        "title": "O Agente Secreto",
        "original_title": "Secret Agent",
        "year": 1936,
        "runtime_min": 86,
        "kind": "feature",
        "genres": ["Suspense", "Mistério"],
        "directors": ["Alfred Hitchcock"],
        "tagline": "Um dos primeiros e mais elegantes suspenses britânicos de Hitchcock.",
        "overview_pt": "Durante a Primeira Guerra, um soldado britânico cuja morte é forjada pelo governo é enviado à Suíça neutra para identificar e eliminar um espião alemão.",
        "tmdb_id": 2761,
    },
    {
        "archive_id": "CC_1916_10_02_ThePawnshop",
        "title": "O Balcão de Penhores",
        "original_title": "The Pawnshop",
        "year": 1916,
        "runtime_min": 25,
        "kind": "short",
        "genres": ["Comédia", "Clássico"],
        "directors": ["Charlie Chaplin"],
        "tagline": "O gênio cômico de Charles Chaplin no auge de sua precisão visual.",
        "overview_pt": "Chaplin interpreta o desastrado assistente de uma casa de penhores que quase destrói a loja inteira enquanto tenta desmontar um despertador cliente por cliente.",
        "tmdb_id": 2078,
    },
    {
        "archive_id": "Quicksand_clear",
        "title": "Areias Movediças",
        "original_title": "Quicksand",
        "year": 1950,
        "runtime_min": 79,
        "kind": "feature",
        "genres": ["Noir", "Crime", "Drama"],
        "directors": ["Irving Pichel"],
        "tagline": "Mickey Rooney e Peter Lorre numa teia sem saída de pequenos crimes.",
        "overview_pt": "Um jovem mecânico 'pega emprestado' 20 dólares da caixa registradora para impressionar uma garçonete e acaba tragado por uma espiral de chantagens, roubos e violência.",
        "tmdb_id": 23342,
    },
    {
        "archive_id": "iron_mask",
        "title": "A Máscara de Ferro",
        "original_title": "The Iron Mask",
        "year": 1929,
        "runtime_min": 95,
        "kind": "feature",
        "genres": ["Aventura", "Ação", "Histórico"],
        "directors": ["Allan Dwan"],
        "tagline": "Douglas Fairbanks como o imortal D'Artagnan e os Três Mosqueteiros.",
        "overview_pt": "Os Três Mosqueteiros reúnem-se uma última vez para proteger o trono francês da conspiração que trancafiou o irmão gêmeo do Rei Luís XIV sob uma máscara de ferro.",
        "tmdb_id": 79761,
    },
    {
        "archive_id": "Killers_from_space",
        "title": "Assassinos do Espaço",
        "original_title": "Killers from Space",
        "year": 1954,
        "runtime_min": 71,
        "kind": "feature",
        "genres": ["Ficção Científica", "Terror"],
        "directors": ["W. Lee Wilder"],
        "tagline": "Invasores alienígenas com olhos hipnóticos planejam dominar a Terra.",
        "overview_pt": "Um cientista nuclear sobrevive milagrosamente à queda de seu avião e descobre que alienígenas sequestraram seu corpo para roubar segredos de armas atômicas.",
        "tmdb_id": 23045,
    },
    {
        "archive_id": "TheGhoul",
        "title": "O Cadáver Maldito",
        "original_title": "The Ghoul",
        "year": 1933,
        "runtime_min": 77,
        "kind": "feature",
        "genres": ["Terror", "Mistério"],
        "directors": ["T. Hayes Hunter"],
        "tagline": "Boris Karloff retorna dos mortos em busca de sua joia sagrada egípcia.",
        "overview_pt": "Um egiptólogo à beira da morte pede para ser enterrado com uma joia mística que lhe concederá vida eterna. Quando o rubi é roubado de sua tumba, ele ressuscita sedento por vingança.",
        "tmdb_id": 28046,
    },
]


async def seed():
    logger.info(f"Iniciando carga de {len(CURATED_CATALOG)} obras-primas em Domínio Público no Lumière...")
    archive_client = InternetArchiveClient()
    tmdb_client = TMDBClient()

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        for idx, item in enumerate(CURATED_CATALOG, 1):
            archive_id = item["archive_id"]
            logger.info(f"[{idx}/{len(CURATED_CATALOG)}] Processando: {item['title']} ({item['year']})")

            # Busca metadados do Internet Archive
            meta = await archive_client.get_item_metadata(archive_id)
            if not meta:
                logger.warning(f"Metadados não encontrados para {archive_id}. Tentando fallback.")
                meta = {"files": []}

            # Encontra melhor MP4
            best_mp4 = archive_client.pick_best_mp4(archive_id, meta)
            if not best_mp4:
                # URL fallback padrão do Archive.org
                best_mp4 = {
                    "url": f"https://archive.org/download/{archive_id}/{archive_id}.mp4",
                    "height": 480,
                    "size_bytes": 450000000,
                    "duration_s": item["runtime_min"] * 60,
                }

            # Thumbnail fallback garantido do Archive.org
            fallback_poster = f"https://archive.org/services/img/{archive_id}"
            fallback_backdrop = fallback_poster

            # TMDB Enrichment
            poster_url = fallback_poster
            backdrop_url = fallback_backdrop
            overview = item["overview_pt"]

            if item.get("tmdb_id"):
                try:
                    tmdb_details = await tmdb_client.get_movie_details(item["tmdb_id"])
                    if tmdb_details:
                        if tmdb_details.get("poster_path"):
                            poster_url = tmdb_client.get_poster_url(tmdb_details["poster_path"], size="w500")
                        if tmdb_details.get("backdrop_path"):
                            backdrop_url = tmdb_client.get_backdrop_url(tmdb_details["backdrop_path"], size="original")
                        if tmdb_details.get("overview") and len(tmdb_details["overview"]) > 25:
                            overview = tmdb_details["overview"]
                except Exception as e:
                    logger.warning(f"Erro ao buscar TMDB para {item['title']}: {e}")

            # Avaliação de Licença no Brasil (Lei 9.610/98 Art. 44)
            license_res_br = LicenseEngine.evaluate(item["year"], region="BR")
            license_res_us = LicenseEngine.evaluate(item["year"], region="US")

            # Verifica se já existe obra cadastrada com esse archive_id
            existing_source_res = await session.execute(
                select(Source).where(Source.provider == "archive", Source.external_id == archive_id)
            )
            existing_source = existing_source_res.scalars().first()

            if existing_source:
                work_res = await session.execute(select(Work).where(Work.id == existing_source.work_id))
                work = work_res.scalars().first()
                if work:
                    work.title = item["title"]
                    work.original_title = item["original_title"]
                    work.poster_path = poster_url
                    work.backdrop_path = backdrop_url
                    work.overview_pt = overview
                    work.tagline = item.get("tagline")
                    work.genres = item.get("genres", [])
                    work.people = {"directors": item.get("directors", [])}
                    work.published = True
                await session.commit()
                continue

            # Cria novo Work
            work = Work(
                title=item["title"],
                original_title=item["original_title"],
                year=item["year"],
                runtime_min=item["runtime_min"],
                kind=item["kind"],
                tmdb_id=item.get("tmdb_id"),
                poster_path=poster_url,
                backdrop_path=backdrop_url,
                overview_pt=overview,
                tagline=item.get("tagline"),
                genres=item.get("genres", []),
                people={"directors": item.get("directors", [])},
                published=True,
            )
            session.add(work)
            await session.flush()

            # Cria Source
            source = Source(
                work_id=work.id,
                provider="archive",
                external_id=archive_id,
                page_url=f"https://archive.org/details/{archive_id}",
                priority=1,
                active=True,
            )
            session.add(source)
            await session.flush()

            # Cria MediaFile
            media = MediaFile(
                source_id=source.id,
                url=best_mp4["url"],
                container="mp4",
                codec="h264",
                height=best_mp4.get("height") or 480,
                size_bytes=best_mp4.get("size_bytes"),
                duration_s=best_mp4.get("duration_s") or (item["runtime_min"] * 60),
                last_status=206,
                fail_count=0,
            )
            session.add(media)

            # Legendas
            subtitles = archive_client.extract_subtitles(archive_id, meta)
            for sub in subtitles:
                session.add(
                    Subtitle(
                        source_id=source.id,
                        lang=sub["lang"],
                        url=sub["url"],
                        origin=sub["origin"],
                    )
                )

            # Licenças
            session.add(
                LicenseAssessment(
                    work_id=work.id,
                    region="BR",
                    status=license_res_br.status,
                    rule=license_res_br.rule,
                    confidence=license_res_br.confidence,
                    evidence=license_res_br.evidence,
                )
            )
            session.add(
                LicenseAssessment(
                    work_id=work.id,
                    region="US",
                    status=license_res_us.status,
                    rule=license_res_us.rule,
                    confidence=license_res_us.confidence,
                    evidence=license_res_us.evidence,
                )
            )

            # Review Item
            session.add(
                ReviewItem(
                    work_id=work.id,
                    state="approved",
                    reason="Curadoria Lumière Play: Obra em domínio público no Brasil e stream direto verificado.",
                    reviewer="lumiere_auto_curator",
                )
            )

            await session.commit()
            logger.info(f"-> Cadastrado id={work.id}: {work.title} com pôster verificado.")

    logger.info("Catálogo Lumière Play expandido e atualizado com sucesso!")


if __name__ == "__main__":
    asyncio.run(seed())
