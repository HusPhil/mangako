import axios from 'axios';
import cheerio from 'cheerio';
import uuid from 'react-native-uuid'
import { Buffer } from 'buffer';


const headers = {
    'sec-ch-ua': '"Microsoft Edge";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
    'Referer': 'https://chapmanganato.to/',
    'sec-ch-ua-mobile': '?0',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0',
    'sec-ch-ua-platform': '"Windows"'
};

export const getMangaByOrder = async (selector, page) => {
    try {
        const targetUrl = `https://mangakakalot.com/manga_list?type=topview&category=all&state=completed&page=${page}`;
        const response = await axios.get(targetUrl, { headers });

        if (response.status === 200) {
            const html = response.data;
            
            const $ = cheerio.load(html);
            const scrapedData = [];

            $(selector).each((index, element) => {
                const title = $(element).find('a').attr('title');
                const link = $(element).find('a').attr('href');
                const imageUrl = $(element).find('img').attr('src');

                scrapedData.push({
                    "id": uuid.v4(),
                    "title": title,
                    "link": link,
                    "cover": imageUrl,
                });
            });
            return scrapedData; 
        } else {
            console.log(`Failed to scrape data. Status code: ${response.status}`);
            return null
        }
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
};

export const getMangaDetails = async (mangaUrl) => {
    try {
      const targetUrl = mangaUrl;
      const response = await axios.get(targetUrl, { headers });
  
      if (response.status === 200) {
        const html = response.data;
        const $ = cheerio.load(html);

        const mangaDetails = {
          id: uuid.v4(),
          author: $('td:contains("Author(s) :")').next().text().trim(),
          status: $('td:contains("Status :")').next().text().trim(),
          alternativeNames: $('td:contains("Alternative :")').next().text().trim().split(';').map(altTitle => altTitle.trim()),
          tags: $('td:contains("Genres :")').next().text().trim().split(' - ').map(genre => genre.trim()),
          desc: $('#panel-story-info-description').text().trim().substring($('#panel-story-info-description').text().trim().indexOf(":")+1).trim(),
        };
        return mangaDetails;
      } else {
        console.log(`Failed to scrape data. Status code: ${response.status}`);
        return null;
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
      return null;
    }
};

export const getChapterImageUrls = async (mangaUrl) => {
    try {
        const targetUrl = mangaUrl;
        const response = await axios.get(targetUrl, { headers });
    
        if (response.status === 200) {
          const html = response.data;
          const $ = cheerio.load(html);
  
          const chapterImageUrls = [];
  
          const imgElements = $('div.container-chapter-reader > img');

          for (let i = 0; i < imgElements.length; i++) {
            const imgUrl = $(imgElements[i]).attr('src');
            chapterImageUrls.push(imgUrl);
          }



          return chapterImageUrls;
        } else {
          console.log(`Failed to scrape data. Status code: ${response.status}`);
          return null;
        }
      } catch (error) {
        console.error(`Error: ${error.message}`);
        return null;
      }
}

export const getChapterList = async (mangaUrl) => {
  try {
    const targetUrl = mangaUrl;
    const response = await axios.get(targetUrl, { headers });

    if (response.status === 200) {
      const html = response.data;
      const $ = cheerio.load(html);

      const chapterList = [];

      $('ul.row-content-chapter > li').each((index, item) => {
          const chNum = $(item).find('a').text().trim();
          const publishDate = $(item).find('span.chapter-time.text-nowrap').text().trim();
          const chapterUrl = $(item).find('a').attr('href');
          const chapId = `${chapterUrl}-${chNum}-${publishDate}`;
      
          chapterList.push({
              chapId,
              chNum,
              publishDate,
              chapterUrl,
          });
      });

      return chapterList;
    } else {
      console.log(`Failed to scrape data. Status code: ${response.status}`);
      return null;
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return null;
  }
}

export const getChapterImage = async (imageUrl) => {
  
  try {
    // Make the request and get the image data as an arraybuffer
    const response = await axios({
      method: 'get',
      url: imageUrl,
      responseType: 'arraybuffer',
      headers: headers
    });

    if (response.status === 200) {
      const base64Image = Buffer.from(response.data, 'binary').toString('base64');
      return base64Image;
    } else {
      console.log(`Failed to retrieve the image. Status code: ${response.status}`);
      return null; // Handle failure case as needed
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    throw error; // Re-throw error to handle it in the calling function
  }
}
  
