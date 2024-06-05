import axios from 'axios';
import { Buffer } from 'buffer';
// import RNFetchBlob from 'rn-fetch-blob';
// import AsyncStorage from '@react-native-async-storage/async-storage';

const _baseUrl = 'https://api.mangadex.org';
const api = axios.create({
  baseURL: _baseUrl, 
  timeout: 10000, 
});

const formatParams = (params) => {
  const searchParams = new URLSearchParams();

  Object.keys(params).forEach(key => {
    if (Array.isArray(params[key])) {
      params[key].forEach(value => {
        searchParams.append(`${key}[]`, value);
      });
    } else if (typeof params[key] === 'object') {
      Object.keys(params[key]).forEach(subKey => {
        searchParams.append(`${key}[${subKey}]`, params[key][subKey]);
      });
    } else {
      searchParams.append(key, params[key]);
    }
  });

  return searchParams;
};


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
    console.log('Error fetching manga by title:', error);
    // throw error;
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

export const getMangaChapters = async (mangaID) => {
  try {
    let resp;
    let offset = 0;
    const chapterMap = new Map();

    do {
      resp = await api.get(`/chapter`, {
        params: formatParams({
          limit: 100,
          manga: mangaID,
          translatedLanguage: ['en'],
          offset: offset,
          includes: ["manga"]
        })
      });

      if (resp.data.result !== 'ok') break;

      const chapters = resp.data.data;

      chapters.forEach((chapter) => {
        const chNum = parseFloat(chapter.attributes.chapter);
        if (!chapterMap.has(chNum)) {
          chapterMap.set(chNum, {
            id: chapter.id,
            chNum: chapter.attributes.chapter,
            publishDate: new Date(chapter.attributes.publishAt).toISOString().split('T')[0]
          });
        }
      });

      offset += 100;
    } while (resp.data.total > offset);

    const allChapters = Array.from(chapterMap.values()).sort((a, b) => parseFloat(b.chNum) - parseFloat(a.chNum));
    return allChapters;
  } catch (error) {
    console.error('Error fetching manga chapters:', error);
  }
};

export const getMangaFeed = async (mangaID) => {
  try {
    const resp = await api.get(`/manga/${mangaID}/feed`);

    console.log(resp.url)

    const result = resp.data.data.map((chapters) => {
      return(
        {
          id: chapters.id,
          chNum: chapters.attributes.chapter,
          publishDate: new Date(chapters.attributes.publishAt).toISOString().split('T')[0],
        }
      )
    })
    result.sort((a, b) => parseFloat(b.chNum) - parseFloat(a.chNum));
    return result;
  } catch (error) {
    console.error('Error fetching manga by title:', error);
    throw error;
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
  const url = 'https://v16.mkklcdnv6tempv5.com/img/tab_16/00/03/66/ko951723/chapter_72/5-o.jpg';
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
