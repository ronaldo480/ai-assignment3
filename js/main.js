// 공통 기능
document.addEventListener('DOMContentLoaded', () => {
    // 문의 폼 제출 처리
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData);

            // 여기에 폼 제출 로직 추가
            console.log('문의 내용:', data);
            alert('문의가 접수되었습니다.');
            contactForm.reset();
        });
    }
}); 