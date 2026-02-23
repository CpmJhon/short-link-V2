import axios from 'axios';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

export const config = {
  api: {
    bodyParser: false
  }
};

const upload = multer({ storage: multer.memoryStorage() });

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

export default async function handler(req, res) {

  if (req.method !== 'POST') {
    return res.status(405).json({ status:false, error:'Method not allowed' });
  }

  // === CLOUDINARY (multipart upload) ===
  if (req.headers['content-type']?.includes('multipart/form-data')) {

    upload.single('image')(req, res, async function (err) {
      if (err) return res.status(500).json({ status:false, error:'Upload error' });

      try {

        const stream = cloudinary.uploader.upload_stream(
          { folder: 'jhonlink_uploads' },
          (error, result) => {
            if (error) {
              return res.status(500).json({ status:false, error:error.message });
            }
            return res.json({ status:true, result: result.secure_url });
          }
        );

        stream.end(req.file.buffer);

      } catch (error) {
        return res.status(500).json({ status:false, error:error.message });
      }
    });

    return;
  }

  // === SHORTLINK LOGIC ===
  const { url, provider, alias } = req.body;

  try {

    if (provider === 'isgd') {
      const r = await axios.get(`https://is.gd/create.php?format=json&url=${encodeURIComponent(url)}`);
      if (r.data.errorcode) throw new Error(r.data.errormessage);
      return res.json({ status:true, result:r.data.shorturl });
    }

    if (provider === 'tinyurl') {
      const r = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
      return res.json({ status:true, result:r.data });
    }

    return res.status(400).json({ status:false, error:'Provider tidak valid' });

  } catch (error) {
    return res.status(500).json({ status:false, error:error.message });
  }
}