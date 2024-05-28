import axios from 'axios';
import { Buffer } from 'buffer';
// import RNFetchBlob from 'rn-fetch-blob';
// import AsyncStorage from '@react-native-async-storage/async-storage';

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
        cover: `https://uploads.mangadex.org/covers/${element.id}/${coverFileName}.256.jpg`,
        details: {
          "status":  element.attributes.status, 
          "desc":  Object.values(element.attributes.description)[0],  
          "altTitles": element.attributes.altTitles, 
          "tags" : element.attributes.tags,
          "contentRating": element.attributes.contentRating,

        },
      };

    });
    return mangaData

  } catch (error) {
    console.log(error)
  }

};

export const base64toBlob = (base64Data, contentType) => {
  contentType = contentType || '';
    var sliceSize = 1024;
    var byteCharacters = atob(base64Data);
    var byteArrays = [];

    for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        var slice = byteCharacters.slice(offset, offset + sliceSize);

        var byteNumbers = new Array(slice.length);
        for (var i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        var byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: contentType });
}

export const tryScrape = async () => {
  // URL and headers
  const url = 'https://v15.mkklcdnv6tempv5.com/img/tab_15/03/76/41/lp988998/chapter_1/1-o.jpg';
  const headers = {
    'sec-ch-ua': '"Microsoft Edge";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
    'Referer': 'https://chapmanganato.to/',
    'sec-ch-ua-mobile': '?0',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0',
    'sec-ch-ua-platform': '"Windows"'
  };

  try {
    // Make the request and get the image data as an arraybuffer
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'arraybuffer',
      headers: headers
    });

    if (response.status === 200) {
      const base64Image = Buffer.from(response.data, 'binary').toString('base64');
      console.log(response.data)

      return base64Image;
    } else {
      console.log(`Failed to retrieve the image. Status code: ${response.status}`);
      return null; // Handle failure case as needed
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    throw error; // Re-throw error to handle it in the calling function
  }
};
