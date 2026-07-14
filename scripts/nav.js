// ── Mobile Nav: priority links + "More" dropdown ──
(function(){
  if (window.innerWidth > 768) return; // desktop only

  var nav = document.querySelector('.nav-links');
  if (!nav) return;

  var links = nav.querySelectorAll(':scope > li');
  if (links.length < 5) return;

  // Links to keep visible (by href match)
  var KEEP = ['/characters/', '/echos/', '/weapons/', '/tier-list/'];

  var hidden = [];
  links.forEach(function(li){
    var a = li.querySelector('a');
    var href = a ? a.getAttribute('href') || '' : '';
    var keep = KEEP.some(function(k){ return href.indexOf(k) === 0; });
    if (!keep && !li.classList.contains('nav-more')) {
      hidden.push(li);
    }
  });

  if (hidden.length === 0) return;

  // Create "More ▾" toggle
  var moreLi = document.createElement('li');
  moreLi.className = 'nav-more';
  var moreBtn = document.createElement('a');
  moreBtn.textContent = 'More ▾';
  moreBtn.href = '#';
  moreBtn.addEventListener('click', function(e){
    e.preventDefault();
    moreLi.classList.toggle('open');
    // Close when clicking outside
    if (moreLi.classList.contains('open')) {
      setTimeout(function(){
        document.addEventListener('click', function closeNav(e){
          if (!moreLi.contains(e.target)) {
            moreLi.classList.remove('open');
            document.removeEventListener('click', closeNav);
          }
        });
      }, 10);
    }
  });
  moreLi.appendChild(moreBtn);

  // Dropdown menu
  var dropdown = document.createElement('ul');
  dropdown.className = 'nav-more-dropdown';
  hidden.forEach(function(li){ dropdown.appendChild(li); });
  moreLi.appendChild(dropdown);

  // Insert More button
  var firstHidden = hidden[0];
  nav.insertBefore(moreLi, firstHidden);

  // Hide moved links
  hidden.forEach(function(li){ li.classList.add('nav-hidden-desktop'); });
})();
