// cart.js - Lógica centralizada de vendas para ProTech Lab
let cart = JSON.parse(localStorage.getItem('protech_active_cart')) || [];

// 1. Alternar visualização do carrinho (Screenshot 1)
function toggleCart(show) {
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('cart-overlay');
    if (!sidebar || !overlay) return;

    if (show) {
        sidebar.classList.remove('translate-x-full');
        overlay.classList.remove('hidden');
        renderCart();
    } else {
        sidebar.classList.add('translate-x-full');
        overlay.classList.add('hidden');
    }
}

// Substitua a sua função renderCart() no cart.js por esta:
function renderCart() {
    const container = document.getElementById('cart-items');
    const subtotalEl = document.getElementById('cart-subtotal');
    if (!container) return;

    let subtotal = 0;
    container.innerHTML = cart.map(item => {
        // Converte o preço com segurança para não dar erro
        const safePrice = Number(item.price); 
        const itemTotal = safePrice * item.quantity;
        subtotal += itemTotal;
        
        return `
            <div class="flex gap-4 items-center bg-white/5 p-4 rounded-xl border border-white/5">
                <img src="${item.image}" class="w-16 h-16 rounded-lg object-cover border border-white/10" onerror="this.src='https://via.placeholder.com/150'">
                <div class="flex-grow">
                    <h4 class="text-[11px] text-white font-black uppercase tracking-tight leading-tight">${item.name}</h4>
                    <div class="flex items-center gap-3 mt-2 text-gray-400">
                        <button onclick="updateQty('${item.id}', -1)" class="w-6 h-6 flex items-center justify-center bg-black rounded-md hover:text-white transition">-</button>
                        <span class="text-[10px] font-mono text-white">${item.quantity}</span>
                        <button onclick="updateQty('${item.id}', 1)" class="w-6 h-6 flex items-center justify-center bg-black rounded-md hover:text-white transition">+</button>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-xs text-white font-black font-mono">R$ ${safePrice.toFixed(2)}</p>
                    <button onclick="removeItem('${item.id}')" class="text-[8px] text-rose-500/60 hover:text-rose-500 mt-2 uppercase font-black tracking-[0.2em]">Remover</button>
                </div>
            </div>`;
    }).join('');

    if (cart.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-600 text-[10px] py-10 uppercase font-black tracking-widest">Carrinho Vazio</p>';
    }

    if (subtotalEl) subtotalEl.innerText = `R$ ${subtotal.toFixed(2)}`;
}

function updateQty(id, delta) {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) return removeItem(id);
        saveCart();
        renderCart();
        updateCartBadge(); // <--- Faltava esta linha para atualizar o número!
    }
}

function removeItem(id) {
    cart = cart.filter(i => i.id !== id);
    saveCart();
    renderCart();
    updateCartBadge();
}

function saveCart() { localStorage.setItem('protech_active_cart', JSON.stringify(cart)); }

function goToCheckout() {
    if (cart.length === 0) return alert("Adicione itens antes de prosseguir.");
    window.location.href = 'checkout.html';
}

function addToCart(productId) {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('s');
    const stores = JSON.parse(localStorage.getItem('protech_stores_v1') || '[]');
    const store = stores.find(s => s.slug === slug);
    
    if (!store) return;

    const product = store.products.find(p => p.id === productId);
    if (!product) return;

    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    if (typeof showToast === "function") {
        showToast(product.name); // Chama o efeito visual que ficou no HTML
    }
    
    saveCart();
    updateCartBadge();
    toggleCart(true); 
}

function updateCartBadge() {
    const badge = document.getElementById('cart-count');
    if (badge) badge.innerText = cart.reduce((total, item) => total + item.quantity, 0);
}

function goToCheckout() {
    if (cart.length === 0) return alert("Adicione itens antes de prosseguir.");
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('s');
    window.location.href = `loja-checkout.html?s=${slug}`; // <-- Aponta para o novo arquivo
}



document.addEventListener('DOMContentLoaded', updateCartBadge);