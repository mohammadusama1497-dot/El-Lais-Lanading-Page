/* ============ Data / Storage ============ */
const CART_KEY = 'ellas_cart';
const LOC_KEY  = 'ellas_location';
let cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
let selectedLocation = localStorage.getItem(LOC_KEY) || null;
let pendingProduct = null;

/* ============ Elements ============ */
const homePage   = document.getElementById('homePage');
const cartPage   = document.getElementById('cartPage');
const cartBtn    = document.getElementById('cartBtn');
const cartCount  = document.getElementById('cartCount');
const hamburger  = document.getElementById('hamburger');
const navLinks   = document.getElementById('navLinks');
const siteHeader = document.getElementById('siteHeader');

const locationModal        = document.getElementById('locationModal');
const closeLocationModalBtn= document.getElementById('closeLocationModal');

const backToShop   = document.getElementById('backToShop');
const cartItemsList = document.getElementById('cartItemsList');
const subtotalEl   = document.getElementById('subtotal');
const totalEl      = document.getElementById('total');
const locDisplay   = document.getElementById('selectedLocationDisplay');

const checkoutForm = document.getElementById('checkoutForm');
const orderSuccess = document.getElementById('orderSuccess');

/* ============ Navigation ============ */
hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('active');
});

document.querySelectorAll('.nav-links > li > a:not(.mega-trigger)').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('active');
    showHome();
  });
});

window.addEventListener('scroll', () => {
  siteHeader.classList.toggle('scrolled', window.scrollY > 20);
});

cartBtn.addEventListener('click', showCart);
backToShop.addEventListener('click', (e) => { e.preventDefault(); showHome(); });

function showHome(){
  cartPage.style.display = 'none';
  homePage.style.display = 'block';
  window.scrollTo({top:0, behavior:'smooth'});
}
function showCart(){
  homePage.style.display = 'none';
  cartPage.style.display = 'block';
  renderCart();
  window.scrollTo({top:0, behavior:'smooth'});
}

/* ============ Mega Menu (mobile click toggle) ============ */
document.querySelectorAll('.mega-trigger').forEach(trigger => {
  trigger.addEventListener('click', (e) => {
    // On mobile screens, toggle accordion instead of jumping to link
    if(window.innerWidth <= 900){
      e.preventDefault();
      const parentLi = trigger.closest('.nav-item');
      const isActive = parentLi.classList.contains('active');

      // close other open mega menus
      document.querySelectorAll('.nav-item.has-mega').forEach(li => li.classList.remove('active'));

      if(!isActive) parentLi.classList.add('active');
    } else {
      // Desktop: clicking the trigger navigates normally (hover shows menu)
      navLinks.classList.remove('active');
    }
  });
});

// Close mega menus & mobile nav when clicking a mega menu link
document.querySelectorAll('.mega-menu a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('active');
    document.querySelectorAll('.nav-item.has-mega').forEach(li => li.classList.remove('active'));
    showHome();
  });
});

/* ============ Add to Cart -> Location flow ============ */
document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    pendingProduct = {
      id: btn.dataset.id,
      name: btn.dataset.name,
      price: parseFloat(btn.dataset.price),
      img: btn.dataset.img,
      qty: 1
    };
    openLocationModal();
  });
});

function openLocationModal(){
  locationModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeLocationModal(){
  locationModal.classList.remove('active');
  document.body.style.overflow = '';
}
closeLocationModalBtn.addEventListener('click', closeLocationModal);
locationModal.addEventListener('click', (e) => {
  if(e.target === locationModal) closeLocationModal();
});

document.querySelectorAll('.select-location-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const card = btn.closest('.location-card');
    selectedLocation = card.dataset.location;
    localStorage.setItem(LOC_KEY, selectedLocation);

    if(pendingProduct){
      addPendingToCart();
    }
    closeLocationModal();
    showCart();
  });
});

function addPendingToCart(){
  if(!pendingProduct) return;
  const existing = cart.find(i => i.id === pendingProduct.id);
  if(existing){ existing.qty += 1; }
  else { cart.push({...pendingProduct}); }
  saveCart();
  updateCartCount();
  pendingProduct = null;
}

function saveCart(){ localStorage.setItem(CART_KEY, JSON.stringify(cart)); }

function updateCartCount(){
  const count = cart.reduce((sum, i) => sum + i.qty, 0);
  cartCount.textContent = count;
}

/* ============ Render Cart ============ */
function renderCart(){
  cartItemsList.innerHTML = '';

  if(cart.length === 0){
    cartItemsList.innerHTML = `
      <div class="empty-cart">
        <p>🛍️ Your cart feels a little lonely...</p>
        <button class="btn-primary" id="startShoppingBtn">Start Shopping</button>
      </div>`;
    document.getElementById('startShoppingBtn').addEventListener('click', showHome);
  } else {
    cart.forEach(item => {
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `
        <img src="${item.img}" alt="${item.name}">
        <div class="cart-item-info">
          <h4>${item.name}</h4>
          <p class="item-price">$${item.price.toFixed(2)} each</p>
          <div class="qty-control">
            <button class="qty-btn minus" data-id="${item.id}">-</button>
            <span>${item.qty}</span>
            <button class="qty-btn plus" data-id="${item.id}">+</button>
          </div>
        </div>
        <div class="cart-item-actions">
          <p class="item-total">$${(item.price * item.qty).toFixed(2)}</p>
          <button class="remove-btn" data-id="${item.id}">🗑 Remove</button>
        </div>`;
      cartItemsList.appendChild(div);
    });
  }

  attachCartItemEvents();
  renderLocation();
  calcTotals();
}

function attachCartItemEvents(){
  document.querySelectorAll('.qty-btn.plus').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = cart.find(i => i.id === btn.dataset.id);
      item.qty++;
      saveCart(); updateCartCount(); renderCart();
    });
  });
  document.querySelectorAll('.qty-btn.minus').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = cart.find(i => i.id === btn.dataset.id);
      item.qty--;
      if(item.qty <= 0) cart = cart.filter(i => i.id !== btn.dataset.id);
      saveCart(); updateCartCount(); renderCart();
    });
  });
  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      cart = cart.filter(i => i.id !== btn.dataset.id);
      saveCart(); updateCartCount(); renderCart();
    });
  });
}

function renderLocation(){
  if(selectedLocation){
    locDisplay.innerHTML = `📍 Pickup Location: <strong>${selectedLocation}</strong> <button id="changeLocBtn">Change</button>`;
    document.getElementById('changeLocBtn').addEventListener('click', () => {
      pendingProduct = null;
      openLocationModal();
    });
  } else {
    locDisplay.innerHTML = `No location selected yet.`;
  }
}

function calcTotals(){
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const shipping = cart.length > 0 ? 5 : 0;
  subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  totalEl.textContent = `$${(subtotal + shipping).toFixed(2)}`;
}

/* ============ Checkout Form ============ */
checkoutForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if(cart.length === 0){
    alert('Your cart is empty! Please add a product first.');
    return;
  }
  if(!selectedLocation){
    alert('Please select a pickup location.');
    openLocationModal();
    return;
  }

  orderSuccess.style.display = 'block';
  checkoutForm.style.display = 'none';

  cart = [];
  saveCart();
  updateCartCount();

  setTimeout(() => {
    orderSuccess.style.display = 'none';
    checkoutForm.style.display = 'flex';
    checkoutForm.reset();
    renderCart();
  }, 4000);
});

/* ============ Booking Enquiry Form ============ */
const bookingForm = document.getElementById('bookingForm');
if(bookingForm){
  bookingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    document.getElementById('bookingMsg').textContent = '✅ Thanks! We will contact you shortly to confirm your slot.';
    bookingForm.reset();
    setTimeout(() => { document.getElementById('bookingMsg').textContent = ''; }, 4000);
  });
}

/* ============ Newsletter Form ============ */
const newsForm = document.getElementById('newsForm');
if(newsForm){
  newsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Thanks for subscribing! 🤍');
    newsForm.reset();
  });
}

/* ============ Scroll Fade Animations ============ */
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if(entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.15 });
document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

/* ============ Close mega menu when clicking outside ============ */
document.addEventListener('click', (e) => {
  if(!e.target.closest('.nav-item.has-mega')){
    document.querySelectorAll('.nav-item.has-mega').forEach(li => li.classList.remove('active'));
  }
});

/* ============ Init ============ */
updateCartCount();