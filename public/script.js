// UI Interaction Script (Sidebar)
        const menuBtn = document.getElementById('menuBtn');
        const sidebar = document.getElementById('sidebarMenu');
        const overlay = document.getElementById('sidebarOverlay');
        const closeSidebar = document.getElementById('closeSidebar');

        function toggleSidebar() {
            document.body.classList.toggle('sidebar-active');
        }

        menuBtn.addEventListener('click', toggleSidebar);
        closeSidebar.addEventListener('click', toggleSidebar);
        overlay.addEventListener('click', toggleSidebar);

        // Tab Navigation
        const tabShortener = document.getElementById('tabShortener');
        const tabUpload = document.getElementById('tabUpload');
        const shortenerSection = document.getElementById('shortenerSection');
        const uploadSection = document.getElementById('uploadSection');

        tabShortener.addEventListener('click', () => {
            tabShortener.classList.add('active');
            tabUpload.classList.remove('active');
            shortenerSection.style.display = 'block';
            uploadSection.style.display = 'none';
        });

        tabUpload.addEventListener('click', () => {
            tabUpload.classList.add('active');
            tabShortener.classList.remove('active');
            shortenerSection.style.display = 'none';
            uploadSection.style.display = 'block';
        });

        // --- SHORTENER LOGIC (ORIGINAL - TIDAK BERUBAH) ---
        const form = document.getElementById('shortenForm');
        const providerSelect = document.getElementById('providerSelect');
        const aliasGroup = document.getElementById('aliasGroup');
        const errorMsg = document.getElementById('errorMsg');
        const resultBox = document.getElementById('result-box');
        const resultUrl = document.getElementById('resultUrl');
        const submitBtn = document.getElementById('submitBtn');
        const btnText = document.getElementById('btnText');
        const spinner = document.getElementById('loadingSpinner');

        // Toggle Custom Alias hanya untuk TinyURL
        providerSelect.addEventListener('change', () => {
            aliasGroup.style.display = providerSelect.value === 'tinyurl' ? 'block' : 'none';
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Reset State
            errorMsg.style.display = 'none';
            resultBox.style.display = 'none';
            submitBtn.disabled = true;
            btnText.textContent = 'Memproses...';
            spinner.style.display = 'inline-block';

            const payload = {
                url: document.getElementById('urlInput').value,
                provider: providerSelect.value,
                alias: document.getElementById('aliasInput').value
            };

            try {
                const req = await fetch('/api/shorten', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const res = await req.json();

                if (res.status) {
                    resultUrl.value = res.result;
                    resultBox.style.display = 'block';
                } else {
                    throw new Error(res.error || 'Gagal terhubung ke server.');
                }

            } catch (err) {
                errorMsg.textContent = err.message;
                errorMsg.style.display = 'block';
            } finally {
                submitBtn.disabled = false;
                btnText.textContent = 'Shorten URL';
                spinner.style.display = 'none';
            }
        });

        window.copyResult = function() {
            resultUrl.select();
            resultUrl.setSelectionRange(0, 99999);
            navigator.clipboard.writeText(resultUrl.value);
            alert('Link berhasil disalin!');
        };

        // --- CLOUDINARY UPLOAD LOGIC ---
        // Cloudinary config
        const CLOUD_NAME = "ddbqhpuoz";
        const UPLOAD_PRESET = "upload_Jhon";

        let selectedFile = null;
        const soundEnabled = true;

        // Audio elements
        const soundSuccess = document.getElementById('soundSuccess');
        const soundError = document.getElementById('soundError');
        const soundWarning = document.getElementById('soundWarning');

        // DOM Elements
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');
        const fileNameInput = document.getElementById('fileNameInput');
        const previewContainer = document.getElementById('previewContainer');
        const previewImage = document.getElementById('previewImage');
        const uploadBtn = document.getElementById('uploadBtn');
        const progressContainer = document.getElementById('progressContainer');
        const progressBar = document.getElementById('progressBar');
        const resultDiv = document.getElementById('result');

        // === FUNGSI RESET UPLOAD SECTION ===
        function resetUploadSection() {
            // Reset form
            fileInput.value = "";
            fileNameInput.value = "";
            previewContainer.classList.add("hidden");
            previewImage.src = "";
            selectedFile = null;
            
            // Reset progress
            progressContainer.style.display = "none";
            progressBar.style.width = "0%";
            progressBar.textContent = "0%";
            
            // Hapus hasil upload
            resultDiv.innerHTML = "";
            
            // Scroll ke atas section upload
            uploadSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        // === TOAST FUNCTION ===
        function showToast(message, type = "success") {
            const toast = document.createElement("div");
            let bgColor = "bg-green-600";
            let icon = "✔";
            let sound = soundSuccess;

            if (type === "error") { bgColor = "bg-red-600"; icon = "✖"; sound = soundError; }
            if (type === "warning") { bgColor = "bg-yellow-500 text-black"; icon = "⚠"; sound = soundWarning; }

            toast.className =
                `flex items-center gap-2 px-4 py-2 rounded shadow text-sm animate-slideInRight text-white ${bgColor}`;
            toast.innerHTML = `<span>${icon}</span> <span>${message}</span> <button class="ml-3 text-lg leading-none">✖</button>`;

            const closeBtn = toast.querySelector("button");
            closeBtn.addEventListener("click", () => {
                toast.classList.remove("animate-slideInRight");
                toast.classList.add("animate-slideOutRight");
                setTimeout(() => toast.remove(), 400);
            });

            document.getElementById("toastContainer").appendChild(toast);

            if (soundEnabled) {
                sound.currentTime = 0;
                sound.play().catch(e => console.log('Audio play failed:', e));
            }

            setTimeout(() => {
                toast.classList.remove("animate-slideInRight");
                toast.classList.add("animate-slideOutRight");
                setTimeout(() => toast.remove(), 400);
            }, 3000);
        }

        // === UPLOAD HANDLER ===
        function showPreview(file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImage.src = e.target.result;
                previewContainer.classList.remove("hidden");
            };
            reader.readAsDataURL(file);
        }

        dropZone.addEventListener("click", () => fileInput.click());
        
        fileInput.addEventListener("change", () => {
            if (fileInput.files.length > 0) {
                selectedFile = fileInput.files[0];
                showPreview(selectedFile);
            }
        });

        dropZone.addEventListener("dragover", (e) => {
            e.preventDefault();
            dropZone.classList.add("border-green-400", "bg-gray-100");
        });
        
        dropZone.addEventListener("dragleave", () => {
            dropZone.classList.remove("border-green-400", "bg-gray-100");
        });
        
        dropZone.addEventListener("drop", (e) => {
            e.preventDefault();
            dropZone.classList.remove("border-green-400", "bg-gray-100");
            if (e.dataTransfer.files.length > 0) {
                selectedFile = e.dataTransfer.files[0];
                showPreview(selectedFile);
            }
        });

        uploadBtn.addEventListener("click", () => {
            if (!selectedFile) {
                alert("Pilih atau drag file dulu");
                return;
            }

            const customName = fileNameInput.value.trim();
            resultDiv.innerHTML = "";
            progressContainer.style.display = "block";
            progressBar.style.width = "0%";
            progressBar.textContent = "0%";

            const formData = new FormData();
            formData.append("file", selectedFile);
            formData.append("upload_preset", UPLOAD_PRESET);
            if (customName) formData.append("public_id", customName);

            const xhr = new XMLHttpRequest();
            xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, true);

            xhr.upload.addEventListener("progress", (e) => {
                if (e.lengthComputable) {
                    const percent = Math.round((e.loaded * 100) / e.total);
                    progressBar.style.width = percent + "%";
                    progressBar.textContent = percent + "%";
                }
            });

            xhr.onload = async () => {
                progressBar.style.width = "100%";
                progressBar.textContent = "100%";

                const data = JSON.parse(xhr.responseText);
                if (data.secure_url) {
                    const directUrl = data.secure_url;
                    const bbCode = `[img]${directUrl}[/img]`;
                    const markdown = `![image](${directUrl})`;
                    const htmlTagDisplay = `&lt;img src="${directUrl}" alt="image"&gt;`;
                    const htmlTagCopy = `<img src="${directUrl}" alt="image">`;

                    const encDirect = encodeURIComponent(directUrl);
                    const encBb = encodeURIComponent(bbCode);
                    const encMd = encodeURIComponent(markdown);
                    const encHtml = encodeURIComponent(htmlTagCopy);

                    await navigator.clipboard.writeText(directUrl);

                    resultDiv.innerHTML = `
                        <div class="success-badge">
                            <i class="fas fa-check-circle"></i> Upload Berhasil!
                        </div>

                        <div class="result-item">
                            <div class="result-label">
                                <i class="fas fa-link"></i> Direct URL
                            </div>
                            <div class="result-content">
                                <a href="${directUrl}" target="_blank" class="result-link">${directUrl}</a>
                                <button class="copy-btn" data-text="${encDirect}">Copy</button>
                            </div>
                        </div>

                        <div class="result-item">
                            <div class="result-label">
                                <i class="fas fa-code"></i> BBCode
                            </div>
                            <div class="result-content">
                                <code class="result-code">${bbCode}</code>
                                <button class="copy-btn" data-text="${encBb}">Copy</button>
                            </div>
                        </div>

                        <div class="result-item">
                            <div class="result-label">
                                <i class="fab fa-markdown"></i> Markdown
                            </div>
                            <div class="result-content">
                                <code class="result-code">${markdown}</code>
                                <button class="copy-btn" data-text="${encMd}">Copy</button>
                            </div>
                        </div>

                        <div class="result-item">
                            <div class="result-label">
                                <i class="fab fa-html5"></i> HTML &lt;img&gt;
                            </div>
                            <div class="result-content">
                                <code class="result-code">${htmlTagDisplay}</code>
                                <button class="copy-btn" data-text="${encHtml}">Copy</button>
                            </div>
                        </div>

                        <div class="note-text">
                            <i class="fas fa-info-circle"></i> Direct URL sudah otomatis dicopy ke clipboard
                        </div>

                        <div class="action-buttons">
                            <button class="upload-new-btn" id="uploadNewBtn">
                                <i class="fas fa-plus-circle"></i> Upload Gambar Baru
                            </button>
                            <button class="clear-btn" id="clearResultBtn">
                                <i class="fas fa-times-circle"></i> Bersihkan
                            </button>
                        </div>
                    `;

                    // Copy button functionality
                    document.querySelectorAll(".copy-btn").forEach(btn => {
                        btn.addEventListener("click", async () => {
                            const encoded = btn.getAttribute("data-text");
                            const text = decodeURIComponent(encoded);
                            await navigator.clipboard.writeText(text);
                            
                            const originalText = btn.textContent;
                            btn.textContent = "Copied!";
                            btn.classList.add("copied");
                            
                            setTimeout(() => {
                                btn.textContent = "Copy";
                                btn.classList.remove("copied");
                            }, 2000);
                        });
                    });

                    // Upload New button
                    document.getElementById('uploadNewBtn').addEventListener('click', () => {
                        resetUploadSection();
                    });

                    // Clear button
                    document.getElementById('clearResultBtn').addEventListener('click', () => {
                        resultDiv.innerHTML = "";
                        showToast("Hasil upload dibersihkan", "success");
                    });

                    showToast("Upload berhasil & link dicopy", "success");

                    // Auto-hide progress bar (tapi hasil tetap ada)
                    setTimeout(() => {
                        progressContainer.style.display = "none";
                    }, 1000);

                } else {
                    resultDiv.innerHTML = `
                        <p class="text-red-500 mt-4 text-center">❌ Upload gagal!</p>
                        <div class="action-buttons">
                            <button class="upload-new-btn" id="retryUploadBtn">
                                <i class="fas fa-redo"></i> Coba Upload Lagi
                            </button>
                        </div>
                    `;
                    
                    document.getElementById('retryUploadBtn').addEventListener('click', () => {
                        resetUploadSection();
                    });
                    
                    showToast("Upload gagal", "error");
                }
            };

            xhr.onerror = () => {
                resultDiv.innerHTML = `
                    <p class="text-red-500 mt-4 text-center">⚠️ Terjadi error saat upload.</p>
                    <div class="action-buttons">
                        <button class="upload-new-btn" id="retryUploadBtn">
                            <i class="fas fa-redo"></i> Coba Lagi
                        </button>
                        <button class="clear-btn" id="clearResultBtn">
                            <i class="fas fa-times-circle"></i> Tutup
                        </button>
                    </div>
                `;
                
                document.getElementById('retryUploadBtn').addEventListener('click', () => {
                    resetUploadSection();
                });
                
                document.getElementById('clearResultBtn').addEventListener('click', () => {
                    resultDiv.innerHTML = "";
                });
                
                showToast("Terjadi error saat upload", "warning");
            };

            xhr.send(formData);
        });
