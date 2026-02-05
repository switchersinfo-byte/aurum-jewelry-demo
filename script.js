/**
 * AURUM - Luxury Jewelry E-commerce
 * Main JavaScript File
 */

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', function() {
    initLoader();
    initMobileMenu();
    initHeroSlider();
    initQuickLinksSlider();
    initProductSlider();
    initCountdown();
    initWishlist();
    initCart();
    initNewsletter();
});

/**
 * Loader functionality
 */
function initLoader() {
    const loader = document.getElementById('loader');

    // Hide loader after page loads
    window.addEventListener('load', () => {
        setTimeout(() => {
            loader.classList.add('hidden');
        }, 500);
    });
}

/**
 * Mobile Menu functionality
 */
function initMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    const closeMenu = document.querySelector('.close-menu');
    const mobileLinks = document.querySelectorAll('.mobile-nav a');

    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', () => {
            mobileMenu.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    if (closeMenu) {
        closeMenu.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    // Close menu when clicking on a link
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (mobileMenu && mobileMenu.classList.contains('active') &&
            !mobileMenu.contains(e.target) &&
            !menuToggle.contains(e.target)) {
            mobileMenu.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

/**
 * Hero Slider initialization
 */
function initHeroSlider() {
    if (typeof Swiper !== 'undefined') {
        const heroSwiper = new Swiper('.hero-swiper', {
            loop: true,
            autoplay: {
                delay: 5000,
                disableOnInteraction: false,
            },
            effect: 'fade',
            fadeEffect: {
                crossFade: true
            },
            pagination: {
                el: '.hero-swiper .swiper-pagination',
                clickable: true,
            },
            navigation: {
                nextEl: '.hero-swiper .swiper-button-next',
                prevEl: '.hero-swiper .swiper-button-prev',
            },
        });
    }
}

/**
 * Quick Links Slider initialization
 */
function initQuickLinksSlider() {
    if (typeof Swiper !== 'undefined') {
        const quickLinksSwiper = new Swiper('.quick-links-swiper', {
            slidesPerView: 2,
            spaceBetween: 16,
            freeMode: true,
            scrollbar: {
                el: '.quick-links-swiper .swiper-scrollbar',
                draggable: true,
            },
            breakpoints: {
                480: {
                    slidesPerView: 3,
                },
                768: {
                    slidesPerView: 4,
                },
                992: {
                    slidesPerView: 6,
                },
                1200: {
                    slidesPerView: 8,
                }
            }
        });
    }
}

/**
 * Product Slider initialization
 */
function initProductSlider() {
    if (typeof Swiper !== 'undefined') {
        const productSwiper = new Swiper('.products-swiper', {
            slidesPerView: 1,
            spaceBetween: 24,
            navigation: {
                nextEl: '.products-swiper .swiper-button-next',
                prevEl: '.products-swiper .swiper-button-prev',
            },
            breakpoints: {
                640: {
                    slidesPerView: 2,
                },
                992: {
                    slidesPerView: 3,
                },
                1200: {
                    slidesPerView: 4,
                }
            }
        });
    }
}

/**
 * Countdown Timer functionality
 */
function initCountdown() {
    const countdownElement = document.querySelector('.countdown-timer');
    if (!countdownElement) return;

    const endDate = new Date('2026-02-15T23:59:59').getTime();

    function updateCountdown() {
        const now = new Date().getTime();
        const distance = endDate - now;

        if (distance < 0) {
            countdownElement.style.display = 'none';
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        document.getElementById('days').textContent = String(days).padStart(2, '0');
        document.getElementById('hours').textContent = String(hours).padStart(2, '0');
        document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
        document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
}

/**
 * Wishlist functionality
 */
function initWishlist() {
    const wishlistButtons = document.querySelectorAll('.wishlist-btn');
    let wishlist = JSON.parse(localStorage.getItem('aurum-wishlist')) || [];

    wishlistButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const productCard = button.closest('.product-card');
            const productTitle = productCard.querySelector('.product-title').textContent;

            const svg = button.querySelector('svg path');

            if (wishlist.includes(productTitle)) {
                // Remove from wishlist
                wishlist = wishlist.filter(item => item !== productTitle);
                svg.setAttribute('fill', 'none');
                showNotification('Removed from wishlist');
            } else {
                // Add to wishlist
                wishlist.push(productTitle);
                svg.setAttribute('fill', 'currentColor');
                showNotification('Added to wishlist');
            }

            localStorage.setItem('aurum-wishlist', JSON.stringify(wishlist));
        });

        // Set initial state
        const productCard = button.closest('.product-card');
        if (productCard) {
            const productTitle = productCard.querySelector('.product-title')?.textContent;
            if (wishlist.includes(productTitle)) {
                const svg = button.querySelector('svg path');
                svg.setAttribute('fill', 'currentColor');
            }
        }
    });
}

/**
 * Cart functionality
 */
function initCart() {
    const addToCartButtons = document.querySelectorAll('.btn-add-cart');
    const cartCountElement = document.querySelector('.cart-count');
    let cart = JSON.parse(localStorage.getItem('aurum-cart')) || [];

    // Update cart count
    function updateCartCount() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        if (cartCountElement) {
            cartCountElement.textContent = totalItems;
        }
    }

    updateCartCount();

    addToCartButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();

            const productCard = button.closest('.product-card');
            const productTitle = productCard.querySelector('.product-title').textContent;
            const productPrice = productCard.querySelector('.current-price').textContent;

            // Check if product already exists in cart
            const existingItem = cart.find(item => item.title === productTitle);

            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({
                    title: productTitle,
                    price: productPrice,
                    quantity: 1
                });
            }

            localStorage.setItem('aurum-cart', JSON.stringify(cart));
            updateCartCount();
            showNotification('Added to cart');

            // Button animation
            button.textContent = 'Added!';
            button.style.background = '#5AA788';
            setTimeout(() => {
                button.textContent = 'Add to Cart';
                button.style.background = '';
            }, 1500);
        });
    });
}

/**
 * Newsletter form functionality
 */
function initNewsletter() {
    const newsletterForm = document.querySelector('.newsletter-form');

    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const emailInput = newsletterForm.querySelector('input[type="email"]');
            const email = emailInput.value;

            if (email) {
                // Simulate subscription
                showNotification('Thank you for subscribing!');
                emailInput.value = '';
            }
        });
    }
}

/**
 * Notification helper
 */
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: #000;
        color: #D4AF37;
        padding: 1rem 2rem;
        border-radius: 4px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        z-index: 9999;
        animation: slideIn 0.3s ease;
        font-size: 0.95rem;
        font-weight: 500;
    `;
    notification.textContent = message;

    // Add keyframe animation
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(400px);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

/**
 * Smooth scroll for anchor links
 */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#' && href !== '') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

/**
 * Header scroll effect
 */
let lastScroll = 0;
const header = document.querySelector('.header');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
        header.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
    } else {
        header.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
    }

    lastScroll = currentScroll;
});

/**
 * Search functionality (placeholder)
 */
const searchBtn = document.querySelector('.search-btn');
if (searchBtn) {
    searchBtn.addEventListener('click', () => {
        showNotification('Search feature coming soon!');
    });
}

/**
 * Account button functionality (placeholder)
 */
const accountBtn = document.querySelector('.account-btn');
if (accountBtn) {
    accountBtn.addEventListener('click', () => {
        showNotification('Account feature coming soon!');
    });
}

/**
 * Cart button functionality
 */
const cartBtn = document.querySelector('.cart-btn');
if (cartBtn) {
    cartBtn.addEventListener('click', () => {
        const cart = JSON.parse(localStorage.getItem('aurum-cart')) || [];
        if (cart.length === 0) {
            showNotification('Your cart is empty');
        } else {
            showNotification(`You have ${cart.length} item(s) in your cart`);
        }
    });
}
