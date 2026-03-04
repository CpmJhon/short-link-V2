const axios = require('axios');

class ShortUrl {
    // 1. BITLY (Menggunakan API v4)
    bitly = async function (url) {
        try {
            const BITLY_API_KEY = "87bb1223a7e89887f5019e6254306d7cdff69cea";
            
            // Validasi URL
            if (!url.match(/^https?:\/\//)) {
                url = 'https://' + url;
            }

            const response = await axios.post('https://api-ssl.bitly.com/v4/shorten', {
                long_url: url
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${BITLY_API_KEY}`
                },
                timeout: 5000
            });

            if (!response.data || !response.data.link) {
                throw new Error('Bitly API mengembalikan respons tidak valid');
            }

            return response.data.link;
        } catch (error) {
            console.error('Bitly Error:', error.response?.data || error.message);
            
            // Handle error spesifik dari Bitly
            if (error.response?.status === 403) {
                throw new Error('Bitly API key tidak valid atau telah mencapai batas limit.');
            } else if (error.response?.status === 400) {
                throw new Error('Bitly: Format URL tidak valid.');
            } else if (error.response?.status === 429) {
                throw new Error('Bitly: Terlalu banyak permintaan, coba lagi nanti.');
            } else if (error.code === 'ECONNABORTED') {
                throw new Error('Bitly: Timeout, koneksi terlalu lambat.');
            }
            
            throw new Error('Gagal memproses Bitly. Pastikan URL valid dan coba lagi.');
        }
    }
    
    // 2. IS.GD (Menggunakan API Resmi JSON)
    isgd = async function (url) {
        try {
            // Validasi URL
            if (!url.match(/^https?:\/\//)) {
                url = 'https://' + url;
            }

            const response = await axios.get('https://is.gd/create.php', {
                params: {
                    format: 'json',
                    url: url
                },
                timeout: 5000
            });

            if (response.data.errorcode) {
                throw new Error(response.data.errormessage || 'Is.gd menolak URL ini.');
            }

            return response.data.shorturl;
        } catch (error) {
            console.error('ISGD Error:', error.message);
            
            if (error.code === 'ECONNABORTED') {
                throw new Error('IS.GD: Timeout, koneksi terlalu lambat.');
            }
            
            throw new Error('Gagal memproses is.gd. Pastikan URL valid.');
        }
    }
    
    // 3. TINYURL
    tinyurl = async function (url, alias = '') {
        try {
            if (!url.match(/^https?:\/\//)) {
                url = 'https://' + url;
            }

            let apiUrl = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`;
            if (alias) {
                apiUrl += `&alias=${encodeURIComponent(alias)}`;
            }

            const response = await axios.get(apiUrl, {
                timeout: 5000
            });

            if (response.data === 'Error') {
                throw new Error('Alias sudah digunakan atau URL tidak valid.');
            }

            return response.data;
        } catch (error) {
            console.error('TinyURL Error:', error.message);
            
            if (error.response && error.response.status === 422) {
                throw new Error('Custom Alias sudah terpakai. Coba kata lain.');
            } else if (error.code === 'ECONNABORTED') {
                throw new Error('TinyURL: Timeout, koneksi terlalu lambat.');
            }
            
            throw new Error('Gagal memproses TinyURL.');
        }
    }
}

// Handler Vercel
module.exports = async (req, res) => {
    // Header CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ status: false, error: 'Method Not Allowed' });
    }

    const { url, provider, alias } = req.body;

    if (!url) {
        return res.status(400).json({ status: false, error: 'URL tidak boleh kosong.' });
    }

    const shortener = new ShortUrl();

    try {
        let resultUrl;
        
        if (provider === 'bitly') {
            resultUrl = await shortener.bitly(url);
        } else if (provider === 'isgd') {
            resultUrl = await shortener.isgd(url);
        } else if (provider === 'tinyurl') {
            resultUrl = await shortener.tinyurl(url, alias);
        } else {
            return res.status(400).json({ status: false, error: 'Provider tidak valid.' });
        }

        return res.status(200).json({ status: true, result: resultUrl });

    } catch (error) {
        return res.status(500).json({ status: false, error: error.message });
    }
};