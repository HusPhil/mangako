import axios from 'axios';
import { Image } from 'react-native';
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

export const getMangaByOrder = async (targetUrl, selector) => {
    try {
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

export const getMangaBySearch = async (targetUrl, selector) => {
  try {
      const response = await axios.get(targetUrl, { headers });

      if (response.status === 200) {
          const html = response.data;
          const $ = cheerio.load(html);
          const scrapedData = [];

          $(selector).each((index, element) => {
              const title = $(element).find('h3.story_name').text().trim();
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
      const source = targetUrl.match(/https?:\/\/([^\/]+)/)[1]
      const response = await axios.get(targetUrl, { headers });
  
      if (response.status === 200) {
        const html = response.data;
        const $ = cheerio.load(html);

        let mangaDetails = null;

        switch(source) {
          case 'chapmanganato.to':
            mangaDetails = {
              id: uuid.v4(),
              author: $('td:contains("Author(s) :")').next().text().trim(),
              status: $('td:contains("Status :")').next().text().trim(),
              alternativeNames: $('td:contains("Alternative :")').next().text().trim().split(';').map(altTitle => altTitle.trim()),
              tags: $('td:contains("Genres :")').next().text().trim().split(' - ').map(genre => genre.trim()),
              desc: $('#panel-story-info-description').text().trim().substring($('#panel-story-info-description').text().trim().indexOf(":")+1).trim(),
            };
            break
          case 'mangakakalot.com':
            const author = $('li:contains("Author(s) :")').text().trim()
            const status = $('li:contains("Status :")').text().trim()
            const altTitles = $('li:contains("Alternative :")').text().trim()
            const tags = $('li:contains("Genres :")').text().trim()
            const desc = $('#noidungm').text().trim()

            mangaDetails = {
              id: uuid.v4(),
              author: author.substring(author.indexOf(":")+1).trim(),
              status: status.substring(status.indexOf(":")+1).trim(),
              alternativeNames: altTitles.substring(altTitles.indexOf(":")+1).trim().split(';').map(altTitle => altTitle.trim()),
              tags: tags.substring(tags.indexOf(":")+1).trim().split(",").map(genre => genre.trim()).filter(genre => genre !== ""),
              desc: desc.substring(desc.indexOf(":")+1).trim(),
            };
            break
        }
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
};

export const getChapterList = async (mangaUrl) => {
  try {
    const targetUrl = mangaUrl;
    const source = targetUrl.match(/https?:\/\/([^\/]+)/)[1]
    const response = await axios.get(targetUrl, { headers });

    if (response.status === 200) {
      const html = response.data;
      const $ = cheerio.load(html);

      const chapterList = [];

      switch(source) {
        case 'chapmanganato.to':
          $('ul.row-content-chapter > li').each((index, item) => {
            const chTitle = $(item).find('a').text().trim();
            const publishDate = $(item).find('span.chapter-time.text-nowrap').text().trim();
            const chapterUrl = $(item).find('a').attr('href');
            const chapId = `${chapterUrl}-${chTitle}-${publishDate}`;
        
            chapterList.push({
                chapId,
                chTitle,
                publishDate,
                chapterUrl,
            });
          });
          break
        case 'mangakakalot.com':
          $('div.chapter-list > div.row').each((index, item) => {
            const chTitle = $(item).find('a').text().trim();
            const publishDate = $(item).find('span').eq(2).text().trim();
            const chapterUrl = $(item).find('a').attr('href');
            const chapId = `${chapterUrl}-${chTitle}-${publishDate}`;
        
            chapterList.push({
                chapId,
                chTitle,
                publishDate,
                chapterUrl,
            });
          });
          break
        
      }

      
    //   chapterList.push({
    //     chapId: "hello world",
    //     chTitle:"hello world",
    //     publishDate:"hello world",
    //     chapterUrl: "hello world",
    // })
      return chapterList;
    } else {
      console.log(`Failed to scrape data. Status code: ${response.status}`);
      return null;
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return null;
  }
};

export const getChapterImage = async (imageUrl) => {
  try {
    // Make the request and get the image data as an arraybuffer
    const response = await axios({
      method: 'get',
      url: imageUrl,
      responseType: 'arraybuffer',
      headers: headers,
    });

    if (response.status === 200) {
      // Extract image dimensions from response headers
      const contentType = response.headers['content-type'];
      const contentLength = response.headers['content-length'];

      // Assuming content-length header exists and indicates image size
      // Extract width and height from content-length header (if available)
      const dimensionsMatch = contentLength.match(/(\d+)x(\d+)/);
      const width = dimensionsMatch ? parseInt(dimensionsMatch[1]) : null;
      const height = dimensionsMatch ? parseInt(dimensionsMatch[2]) : null;

      console.log(`CHAPTER URL: ${imageUrl}\nImage height: ${height}, width: ${width}`);

      const base64Image = Buffer.from(response.data).toString('base64');
      return base64Image;
    } else {
      console.error(`Failed to retrieve the image. Status code: ${response.status}`);
      return null; // Handle failure case as needed
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    throw error; // Re-throw error to handle it in the calling function
  }
};


export const splitLongImage = async (imageUrl) => {
  const maxHeight = 100
  try {
    // Make the request and get the image data as an arraybuffer
    const response = await axios({
      method: 'get',
      url: imageUrl,
      responseType: 'arraybuffer',
    });

    if (response.status === 200) {
      // Convert array buffer to base64 for lossless encoding
      const base64Image = Buffer.from(response.data).toString('base64');

      // Create a temporary image component to get dimensions
      const tempImageUri = `data:image/jpeg;base64,${base64Image}`;
      const { width, height } = await new Promise((resolve, reject) => {
        Image.getSize(
          tempImageUri,
          (imgWidth, imgHeight) => {
            resolve({ width: imgWidth, height: imgHeight });
          },
          (error) => {
            reject(error);
          }
        );
      });

      // Check if the image height exceeds the maxHeight
      if (height > maxHeight) {
        const slices = [];
        let startY = 0;
        while (startY < height) {
          const sliceHeight = Math.min(maxHeight, height - startY);
          const slice = await new Promise((resolve, reject) => {
            ImageEditor.cropImage(
              tempImageUri,
              {
                offset: { x: 0, y: startY },
                size: { width: width, height: sliceHeight },
              },
              (uri) => resolve(uri),
              (error) => reject(error)
            );
          });
          slices.push(slice);
          startY += maxHeight;
        }
        
        return slices;
      } else {
        return [base64Image]; // Return the original image if it doesn't need to be split
      }
    } else {
      console.error(`Failed to retrieve the image. Status code: ${response.status}`);
      return null; // Handle failure case as needed
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    throw error; // Re-throw error to handle it in the calling function
  }
};
