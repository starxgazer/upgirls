document.addEventListener('DOMContentLoaded', () => {
    const membersGrid = document.getElementById('members-grid');

    fetch('members.json')
        .then(response => response.json())
        .then(data => {
            data.forEach(member => {
                const card = document.createElement('div');
                card.className = 'card';
                
                let socials = '';
                if (member.instagram) {
                    socials += `<p>IG: <a href="https://instagram.com/${member.instagram}" target="_blank">@${member.instagram}</a></p>`;
                }
                if (member.x) {
                    socials += `<p>X: <a href="https://x.com/${member.x}" target="_blank">@${member.x}</a></p>`;
                }
                if (member.tiktok) {
                    socials += `<p>TikTok: <a href="https://tiktok.com/@${member.tiktok}" target="_blank">@${member.tiktok}</a></p>`;
                }

                card.innerHTML = `
                    <h4>${member.name}</h4>
                    ${socials}
                `;
                membersGrid.appendChild(card);
            });
        })
        .catch(error => console.error('Error loading members:', error));
});