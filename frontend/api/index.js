/* global process */
import express from 'express';
import axios from 'axios';
import cors from 'cors';
import 'dotenv/config';

const app = express();

app.use(cors({ origin: "*" }));

const API_KEY = process.env.API_KEY || "2dca580c2a14b55200e784d157207b4d";

// 1. Trending Séries
app.get("/api/series", async (req, res) => {
  const page = req.query.page || 1;
  try {
    const response = await axios.get("https://api.themoviedb.org/3/trending/tv/day", {
      params: {
        api_key: API_KEY,
        include_adult: false,
        language: "pt-BR",
        page: page,
      },
    });
    const data = response.data;
    if (data && data.results) {
      data.results = data.results.map((item) => ({ ...item, media_type: "tv" }));
    }
    res.json(data);
  } catch (error) {
    console.error("Erro ao buscar séries em tendência:", error.message);
    res.status(500).json({ error: "Erro ao buscar dados da API" });
  }
});

// 2. Trending Filmes
app.get("/api/movies", async (req, res) => {
  const page = req.query.page || 1;
  try {
    const response = await axios.get("https://api.themoviedb.org/3/trending/movie/day", {
      params: {
        api_key: API_KEY,
        include_adult: false,
        language: "pt-BR",
        page: page,
      },
    });
    const data = response.data;
    if (data && data.results) {
      data.results = data.results.map((item) => ({ ...item, media_type: "movie" }));
    }
    res.json(data);
  } catch (error) {
    console.error("Erro ao buscar filmes em tendência:", error.message);
    res.status(500).json({ error: "Erro ao buscar filmes da API" });
  }
});

// 3. Trending Todos (Filmes e Séries)
app.get("/api/trending", async (req, res) => {
  const page = req.query.page || 1;
  try {
    const response = await axios.get("https://api.themoviedb.org/3/trending/all/day", {
      params: {
        api_key: API_KEY,
        include_adult: false,
        language: "pt-BR",
        page: page,
      },
    });
    res.json(response.data);
  } catch (error) {
    console.error("Erro ao buscar tendências gerais:", error.message);
    res.status(500).json({ error: "Erro ao buscar tendências" });
  }
});

// 4. Detalhes de Filme
app.get("/api/movie/:id", async (req, res) => {
  const movieId = req.params.id;
  try {
    const response = await axios.get(`https://api.themoviedb.org/3/movie/${movieId}`, {
      params: {
        api_key: API_KEY,
        language: "pt-BR",
        append_to_response: "credits,videos,recommendations,watch/providers",
        include_video_language: "pt,en",
      },
    });
    const data = { ...response.data, media_type: "movie" };
    res.json(data);
  } catch (error) {
    console.error("Erro ao buscar detalhes do filme:", error.message);
    res.status(500).json({ error: "Erro ao buscar detalhes do filme" });
  }
});

// 5. Detalhes de Série
app.get("/api/series/:id", async (req, res) => {
  const seriesId = req.params.id;
  try {
    const response = await axios.get(`https://api.themoviedb.org/3/tv/${seriesId}`, {
      params: {
        api_key: API_KEY,
        language: "pt-BR",
        append_to_response: "credits,videos,recommendations,watch/providers",
        include_video_language: "pt,en",
      },
    });
    const data = { ...response.data, media_type: "tv" };
    res.json(data);
  } catch (error) {
    console.error("Erro ao buscar detalhes da série:", error.message);
    res.status(500).json({ error: "Erro ao buscar os detalhes da série" });
  }
});

// 6. Temporadas de Série
app.get("/api/series/:id/season/:seasonNumber", async (req, res) => {
  const { id, seasonNumber } = req.params;
  try {
    const response = await axios.get(`https://api.themoviedb.org/3/tv/${id}/season/${seasonNumber}`, {
      params: {
        api_key: API_KEY,
        language: "pt-BR",
      },
    });
    res.json(response.data);
  } catch (error) {
    console.error(`Erro ao buscar temporada ${seasonNumber}:`, error.message);
    res.status(500).json({ error: "Erro ao buscar a temporada" });
  }
});

// 7. Busca Multi (Filmes e Séries)
app.get("/api/search", async (req, res) => {
  const query = req.query.query;
  const page = req.query.page || 1;
  const type = req.query.type; // 'movie' | 'tv' | undefined (multi)
  if (!query) return res.status(400).json({ error: "Query obrigatória" });

  const endpoint = type === "movie" ? "search/movie" : type === "tv" ? "search/tv" : "search/multi";

  try {
    const response = await axios.get(`https://api.themoviedb.org/3/${endpoint}`, {
      params: {
        api_key: API_KEY,
        query: query,
        include_adult: false,
        language: "pt-BR",
        page: page,
      },
    });
    const data = response.data;
    if (data && data.results) {
      data.results = data.results
        .filter((i) => i.media_type !== "person")
        .map((i) => ({
          ...i,
          media_type: i.media_type || (type || (i.title ? "movie" : "tv")),
        }));
    }
    res.json(data);
  } catch (error) {
    console.error("Erro na busca:", error.message);
    res.status(500).json({ error: "Erro na busca" });
  }
});

// 8. Gêneros Unificados
app.get("/api/genres", async (req, res) => {
  try {
    const [movieGenresRes, tvGenresRes] = await Promise.all([
      axios.get("https://api.themoviedb.org/3/genre/movie/list", {
        params: { api_key: API_KEY, language: "pt-BR" },
      }),
      axios.get("https://api.themoviedb.org/3/genre/tv/list", {
        params: { api_key: API_KEY, language: "pt-BR" },
      }),
    ]);

    const genreMap = new Map();
    for (const g of movieGenresRes.data.genres || []) {
      genreMap.set(g.id, g);
    }
    for (const g of tvGenresRes.data.genres || []) {
      if (!genreMap.has(g.id)) {
        genreMap.set(g.id, g);
      }
    }

    res.json({ genres: Array.from(genreMap.values()) });
  } catch (error) {
    console.error("Erro ao buscar gêneros:", error.message);
    res.status(500).json({ error: "Erro ao buscar gêneros" });
  }
});

// 9. Discover Unificado (Filmes e Séries com Filtros Reais)
app.get("/api/discover", async (req, res) => {
  const { genre, page = 1, year, rating, sort, type = "movie" } = req.query;

  const endpoint = type === "tv" ? "discover/tv" : "discover/movie";
  const params = {
    api_key: API_KEY,
    language: "pt-BR",
    page: page,
    with_genres: genre || undefined,
  };

  // Ordenação
  if (sort) {
    params.sort_by = sort;
  } else {
    params.sort_by = "popularity.desc";
  }

  // Avaliação mínima
  if (rating) {
    params["vote_average.gte"] = rating;
  }

  // Ano
  if (year) {
    if (type === "tv") {
      params.first_air_date_year = year;
    } else {
      params.primary_release_year = year;
    }
  }

  try {
    const response = await axios.get(`https://api.themoviedb.org/3/${endpoint}`, { params });
    const data = response.data;
    if (data && data.results) {
      data.results = data.results.map((item) => ({
        ...item,
        media_type: type === "tv" ? "tv" : "movie",
      }));
    }
    res.json(data);
  } catch (error) {
    console.error("Erro no discover:", error.message);
    res.status(500).json({ error: "Erro no discover" });
  }
});

export default app;
