const axios = require('axios');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});

class ShortUrl {

    async isgd(url) {
        if (!url.match(/^https?:\/\//)) {
            url = 'https://' + url;
        }

        const response = await axios.get('https://is.gd/create.php', {
            params: { format: 'json', url },
            timeout: 5000
        });

        if (response.data.errorcode) {
            throw new Error(response.data.errormessage);
        }

        return response.data.shorturl;
    }

    async tinyurl(url, alias = '') {
        if (!url.match(/^https?:\/\//)) {
            url = 'https://' + url;
        }

        let apiUrl = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`;
        if (alias) {
            apiUrl += `&alias=${encodeURIComponent(alias)}`;
        }

        const response = await axios.get(apiUrl, { timeout: 5000 });

        if (response.data === 'Error') {
            throw new Error('Alias sudah digunakan atau URL tidak valid.');
        }

        return response.data;
    }
}

module.exports = async (req, res) => {

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ status: false });
    }

    // ==========================
    // CLOUDINARY UPLOAD HANDLER
    // ==========================
    if (req.headers['content-type']?.includes('multipart/form-data')) {

        upload.single('image')(req, res, async function (err) {
            if (err) {
                return res.status(500).json({ status: false, error: "Upload gagal." });
            }

            try {
                const result = await new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        { folder: "jhonlink_pro_uploads" },
                        (error, result) => {
                            if (result) resolve(result);
                            else reject(error);
                        }
                    );
                    stream.end(req.file.buffer);
                });

                return res.status(200).json({
                    status: true,
                    result: result.secure_url
                });

            } catch (error) {
                return res.status(500).json({
                    status: false,
                    error: error.message
                });
            }
        });

        return;
    }

    // ==========================
    // SHORTLINK HANDLER
    // ==========================
    const { url, provider, alias } = req.body;

    if (!url) {
        return res.status(400).json({
            status: false,
            error: "URL tidak boleh kosong."
        });
    }

    const shortener = new ShortUrl();

    try {
        let resultUrl;

        if (provider === 'isgd') {
            resultUrl = await shortener.isgd(url);
        }
        else if (provider === 'tinyurl') {
            resultUrl = await shortener.tinyurl(url, alias);
        }
        else {
            return res.status(400).json({
                status: false,
                error: "Provider tidak valid."
            });
        }

        return res.status(200).json({
            status: true,
            result: resultUrl
        });

    } catch (error) {
        return res.status(500).json({
            status: false,
            error: error.message
        });
    }
};