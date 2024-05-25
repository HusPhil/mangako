import axios from 'axios';

const _baseUrl = 'https://api.mangadex.org';
const api = axios.create({
  baseURL: _baseUrl, 
  timeout: 10000, 
});


  export const getMangaById = async (mangaId) => {
    try {
      const resp = await api.get(`/manga/${mangaId}?includes[]=cover_art`);

      const coverArtRelationship = resp.data.data.relationships.find(item => item.type === "cover_art")

      if (!coverArtRelationship) {
        throw new Error('Cover art not found');
      }

      const coverUrl = `https://uploads.mangadex.org/covers/${mangaId}/${coverArtRelationship.attributes.fileName}.256.jpg`;

      const result = {
        title: resp.data.data.attributes.title.en,
        cover: coverUrl,
      };

      return result;
    } catch (error) {
      console.error('Error fetching manga details:', error);
      throw error;
    }
  };

  export const getMangaByTitle = async (title) => {
    try {
      const resp = await api.get('/manga', {
        params: {
          title: title,
        },
      });
  
      const result = resp.data.data.map(manga => manga.id);
  
      console.log(result);
      return result;
    } catch (error) {
      console.error('Error fetching manga by title:', error);
      throw error;
    }
  };

  export const getMangaByOrder = async (order, limit) => {
    const finalOrderQuery = {};
    for (const [key, value] of Object.entries(order)) {
        finalOrderQuery[`order[${key}]`] = value;
    }

    try {
      const resp = await api.get('/manga',
        {params: {
            limit: limit,
            ...finalOrderQuery
        }}
      );
      console.log(resp.data.data.map(manga => manga.id));
    } catch (error) {
      console.log(error)
    }

  };


  
