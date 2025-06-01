document.addEventListener('DOMContentLoaded', () => {
    const uploadButton = document.getElementById('upload-button');
    const fileInput = document.getElementById('file-input');
    const clothingGrid = document.getElementById('clothing-items');

    // 업로드 버튼 클릭 시 파일 선택 다이얼로그 표시
    uploadButton.addEventListener('click', () => {
        fileInput.click();
    });

    // 파일 선택 시 처리
    fileInput.addEventListener('change', (e) => {
        const files = e.target.files;

        for (const file of files) {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();

                reader.onload = (e) => {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.alt = '옷장 아이템';

                    const item = document.createElement('div');
                    item.className = 'clothing-item';
                    item.appendChild(img);

                    clothingGrid.appendChild(item);
                };

                reader.readAsDataURL(file);
            }
        }
    });
}); 