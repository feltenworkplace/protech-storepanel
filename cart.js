// cart.js - Lógica centralizada de vendas para ProTech Lab (ATUALIZADO PARA A NUVEM)
let cart = JSON.parse(localStorage.getItem('protech_active_cart')) || [];

const urlParams = new URLSearchParams(window.location.search);
const currentSlug = urlParams.get('s');

// --- FISCAL DE SEGURANÇA DO CARRINHO ---
function validateAndCleanCart() {
    // Lemos direto do disco na hora H para nunca usar memória velha
    const savedSlug = localStorage.getItem('protech_cart_store_slug');

    // 1. Se mudou de loja (ou é a primeira vez), esvazia o carrinho antigo
    if (savedSlug !== currentSlug) {
        cart = [];
        localStorage.setItem('protech_cart_store_slug', currentSlug);
        saveCart();
    }

    if (cart.length === 0) return;

    // 2. A MÁGICA AQUI: Puxa os dados da loja que vieram da Nuvem
    const store = window.currentStore;

    // Se a loja ainda não carregou do servidor, seguramos o carrinho como está
    if (!store || !store.products) return;

    // 3. Filtra a mochila: Só mantém o que existe E está "Ativo"
    cart = cart.filter(cartItem => {
        const realProduct = store.products.find(p => p.id === cartItem.id);
        return realProduct && realProduct.status === 'Ativo';
    });
    
    // 4. Atualiza o preço baseando-se na nuvem
    cart.forEach(cartItem => {
        const realProduct = store.products.find(p => p.id === cartItem.id);
        if (realProduct) cartItem.price = realProduct.price;
    });
    
    saveCart();
    updateCartBadge();
}

// --- FUNÇÕES DA INTERFACE DO CARRINHO ---

function toggleCart(show) {
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('cart-overlay');
    if (!sidebar || !overlay) return;

    if (show) {
        validateAndCleanCart(); 
        sidebar.classList.remove('translate-x-full');
        overlay.classList.remove('hidden');
        renderCart();
    } else {
        sidebar.classList.add('translate-x-full');
        overlay.classList.add('hidden');
    }
}

function renderCart() {
    const container = document.getElementById('cart-items');
    const subtotalEl = document.getElementById('cart-subtotal');
    if (!container) return;

    const store = window.currentStore; // Usa a loja da nuvem para puxar as imagens ao vivo

    let subtotal = 0;
    container.innerHTML = cart.map(item => {
        const safePrice = Number(item.price); 
        const itemTotal = safePrice * item.quantity;
        subtotal += itemTotal;
        
        // MÁGICA: Localiza a imagem original sem usar Base64 pesada no carrinho
        const realProduct = store?.products?.find(p => p.id === item.id);
        const imageUrl = realProduct && realProduct.image ? realProduct.image : 'https://via.placeholder.com/150';

        return `
            <div class="flex gap-4 items-center bg-white/5 p-4 rounded-xl border border-white/5">
                <img src="${imageUrl}" class="w-16 h-16 rounded-lg object-cover border border-white/10" onerror="this.src='https://via.placeholder.com/150'">
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

    if (subtotalEl) subtotalEl.innerText = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
}

function updateQty(id, delta) {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) return removeItem(id);
        saveCart();
        renderCart();
        updateCartBadge(); 
    }
}

function removeItem(id) {
    cart = cart.filter(i => i.id !== id);
    saveCart();
    renderCart();
    updateCartBadge();
}

function saveCart() { 
    localStorage.setItem('protech_active_cart', JSON.stringify(cart)); 
}

function addToCart(productId) {
    // 1. Chama o fiscal de segurança ANTES de colocar o item na mochila!
    validateAndCleanCart();

    const store = window.currentStore;
    if (!store || !store.products) return;

    const product = store.products.find(p => p.id === productId);
    if (!product || product.status !== 'Ativo') return;

    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.quantity += 1;
    } else {
        // 2. SALVAÇÃO DA MEMÓRIA: Guarda só o texto, sem a imagem Base64 pesada!
        cart.push({ 
            id: product.id, 
            name: product.name, 
            price: product.price, 
            quantity: 1 
        });
    }
    
    localStorage.setItem('protech_cart_store_slug', currentSlug);
    
    if (typeof showToast === "function") {
        showToast(product.name); 
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
    validateAndCleanCart();
    
    if (cart.length === 0) {
        return alert("Seu carrinho está vazio ou os itens não estão mais disponíveis.");
    }
    
    window.location.href = `loja-checkout.html?s=${currentSlug}`; 
}

document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();
});