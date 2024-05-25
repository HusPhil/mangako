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
      title: Object.values(resp.data.data.attributes.title)[0],
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
    
  const params = {
    limit: limit,
    ...finalOrderQuery
  };

  try {
    const resp = await api.get('/manga?includes[]=cover_art',
      {params: params}
    );


    const mangaData = resp.data.data.map(element => {
      const coverFileName = element.relationships.find(rel => rel.type === 'cover_art').attributes.fileName;

      return {
        id: element.id,
        title: Object.values(element.attributes.title)[0],
        cover: `https://uploads.mangadex.org/covers/${element.id}/${coverFileName}.256.jpg`
      };

    });

    return mangaData

  } catch (error) {
    console.log(error)
  }

};



