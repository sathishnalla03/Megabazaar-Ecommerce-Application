// Elements
const productContainer = document.getElementById("productContainer");
const categorySelect = document.getElementById("categorySelect");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn") || null;

const cartButton = document.getElementById("cartButton");
const cartPanel = document.getElementById("cartPanel");
const closeCart = document.getElementById("closeCart");
const overlay = document.getElementById("overlay");
const cartItemsContainer = document.getElementById("cartItems");
const cartTotalEl = document.getElementById("cartTotal");
const cartCountEl = document.getElementById("cartCount");
const checkoutBtn = document.getElementById("checkoutBtn") || null;

// Cart state
let cart = JSON.parse(localStorage.getItem("shopCart")) || [];

// Save cart helper
function saveCart() {
    localStorage.setItem("shopCart", JSON.stringify(cart));
}

// Update cart count (sum of quantities)
function updateCartCount() {
    const count = cart.reduce((s, it) => s + (it.quantity || 0), 0);
    cartCountEl.textContent = count;
}

// Open/close drawer
function openCart() {
    cartPanel.classList.add("open");
    overlay.classList.add("show");
    cartPanel.setAttribute("aria-hidden", "false");
}

function closeCartPanel() {
    cartPanel.classList.remove("open");
    overlay.classList.remove("show");
    cartPanel.setAttribute("aria-hidden", "true");
}

// Attach listeners
cartButton.addEventListener("click", () => {
    openCart();
});
closeCart.addEventListener("click", closeCartPanel);
overlay.addEventListener("click", closeCartPanel);

// Utility: clear container
function clearNode(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
}

// Create product card (DOM only)
function createProductCard(p) {
    const col = document.createElement("div");
    col.className = "col-12 col-sm-6 col-lg-3 mb-4";

    const card = document.createElement("div");
    card.className = "card border-0 shadow-lg h-100";

    const img = document.createElement("img");
    img.src = p.thumbnail;
    img.className = "card-img-top";
    img.style.height = "220px";
    img.style.objectFit = "cover";
    img.alt = p.title || "product";

    const body = document.createElement("div");
    body.className = "card-body";

    const title = document.createElement("h5");
    title.className = "fw-semibold";
    title.textContent = p.title;

    const price = document.createElement("p");
    price.className = "text-danger fw-bold";
    price.textContent = `₹${p.price}`;

    const btn = document.createElement("button");
    btn.className = "btn btn-outline-danger w-100";
    btn.type = "button";
    btn.textContent = "Add to Cart";
    // store id for quick lookup
    btn.dataset.id = p.id;

    // star element (keeps visible when product is in cart)
    const star = document.createElement("span");
    star.className = "star";
    star.textContent = "⭐";
    star.style.display = "none"; // default hidden

    // click handler
    btn.addEventListener("click", () => {
        addToCart(p, btn, star);
    });

    body.appendChild(title);
    body.appendChild(price);
    body.appendChild(btn);
    body.appendChild(star);

    card.appendChild(img);
    card.appendChild(body);
    col.appendChild(card);

    // if product already in cart, mark button immediately
    if (cart.some(it => it.id === p.id)) {
        markButtonAdded(btn, star);
    }

    return col;
}

// Render products (clear + append)
function renderProducts(products) {
    clearNode(productContainer);
    products.forEach(p => {
        const card = createProductCard(p);
        productContainer.appendChild(card);
    });
}

// Add to cart (or increase quantity)
function addToCart(product, btnEl, starEl) {
    const existing = cart.find(it => it.id === product.id);
    if (existing) {
        existing.quantity = (existing.quantity || 1) + 1;
    } else {
        // store minimal fields (thumbnail/title/price/quantity)
        cart.push({
            id: product.id,
            title: product.title,
            price: product.price,
            thumbnail: product.thumbnail,
            quantity: 1
        });
    }
    saveCart();
    updateCartUI();
    markButtonAdded(btnEl, starEl);
}

// Mark product button as added (persists after reload)
function markButtonAdded(btnEl, starEl) {
    btnEl.classList.add("added");
    btnEl.textContent = "Added";
    // ensure star visible
    starEl.style.display = "inline-block";
}

// Unmark product button (if removed from cart)
function unmarkButton(id) {
    // find the button by data-id
    const btn = document.querySelector(`button.btn[data-id='${id}']`);
    if (btn) {
        btn.classList.remove("added");
        btn.textContent = "Add to Cart";
        // hide adjacent star if present
        const star = btn.parentElement.querySelector(".star");
        if (star) star.style.display = "none";
    }
}

// Build cart item row (DOM)
function buildCartItemRow(item) {
    const wrapper = document.createElement("div");
    wrapper.className = "cart-item";

    const img = document.createElement("img");
    img.src = item.thumbnail;
    img.alt = item.title;

    const info = document.createElement("div");
    info.className = "info";

    const h6 = document.createElement("h6");
    h6.textContent = item.title;

    const price = document.createElement("p");
    price.className = "text-danger fw-bold mb-0";
    price.textContent = `₹${item.price}`;

    // qty controls
    const qtyControls = document.createElement("div");
    qtyControls.className = "qty-controls";

    const minus = document.createElement("button");
    minus.type = "button";
    minus.textContent = "−";
    minus.addEventListener("click", () => {
        changeQty(item.id, -1);
    });

    const qtySpan = document.createElement("span");
    qtySpan.textContent = item.quantity;
    qtySpan.style.minWidth = "22px";
    qtySpan.style.display = "inline-block";
    qtySpan.style.textAlign = "center";
    qtySpan.style.fontWeight = "700";

    const plus = document.createElement("button");
    plus.type = "button";
    plus.textContent = "+";
    plus.addEventListener("click", () => {
        changeQty(item.id, 1);
    });

    qtyControls.appendChild(minus);
    qtyControls.appendChild(qtySpan);
    qtyControls.appendChild(plus);

    info.appendChild(h6);
    info.appendChild(price);
    info.appendChild(qtyControls);

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "btn btn-sm btn-outline-danger";
    removeBtn.title = "Remove";
    removeBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
    removeBtn.addEventListener("click", () => {
        removeFromCart(item.id);
    });

    wrapper.appendChild(img);
    wrapper.appendChild(info);
    wrapper.appendChild(removeBtn);

    return wrapper;
}

// Update cart UI (list, totals)
function updateCartUI() {
    clearNode(cartItemsContainer);
    let total = 0;
    cart.forEach(it => {
        total += it.price * (it.quantity || 1);
        const row = buildCartItemRow(it);
        cartItemsContainer.appendChild(row);
    });
    cartTotalEl.textContent = `₹${total.toFixed(2)}`;
    updateCartCount();
    saveCart();
    // If an item was removed, unmark its product button(s)
    // Remove any buttons that correspond to missing items
    document.querySelectorAll("button.btn[data-id]").forEach(btn => {
        const id = Number(btn.dataset.id);
        if (!cart.some(it => it.id === id)) {
            // hide star and reset text if present
            btn.classList.remove("added");
            btn.textContent = "Add to Cart";
            const star = btn.parentElement.querySelector(".star");
            if (star) star.style.display = "none";
        }
    });
}

// Change quantity helper
function changeQty(id, delta) {
    const item = cart.find(it => it.id === id);
    if (!item) return;
    item.quantity = (item.quantity || 1) + delta;
    if (item.quantity <= 0) {
        cart = cart.filter(it => it.id !== id);
    }
    saveCart();
    updateCartUI();
}

// Remove item
function removeFromCart(id) {
    cart = cart.filter(it => it.id !== id);
    saveCart();
    updateCartUI();
    // unmark the product button visually
    unmarkButton(id);
}
// ---- Robust category loader + product fetcher ----
async function loadCategories() {
    try {
        const res = await fetch("https://dummyjson.com/products/categories");
        const categories = await res.json(); // can be array of strings OR objects (defensive handling)

        // clear existing options
        while (categorySelect.firstChild) categorySelect.removeChild(categorySelect.firstChild);

        // default option
        const defaultOption = document.createElement("option");
        defaultOption.value = "all";
        defaultOption.textContent = "All Categories";
        categorySelect.appendChild(defaultOption);

        // normalize items and append only valid labels
        categories.forEach(cat => {
            // handle either string or object
            const label = (typeof cat === 'string') ?
                cat :
                (cat && (cat.name || cat.title || cat.category || cat.slug || null));

            if (!label) return; // skip weird objects
            const option = document.createElement("option");
            option.value = label;
            option.textContent = label;
            categorySelect.appendChild(option);
        });

        // ensure default selected and attach listener (once)
        categorySelect.value = "all";
        categorySelect.removeEventListener("change", onCategoryChange); // safe-guard
        categorySelect.addEventListener("change", onCategoryChange);
    } catch (err) {
        console.error("Error loading categories:", err);
    }
}

function onCategoryChange() {
    const cat = categorySelect.value || "all";
    fetchProducts(cat);
}

// ---------- PRODUCT FETCH ----------
async function fetchProducts(category = "all") {
    try {
        let url = "https://dummyjson.com/products?limit=100";

        if (category !== "all") {
            // Convert spaces to hyphens & lowercase for proper slug use
            const slug = category.trim().toLowerCase().replace(/\s+/g, '-');
            url = `https://dummyjson.com/products/category/${slug}`;
        }

        const res = await fetch(url);
        const data = await res.json();
        const products = Array.isArray(data) ? data : data.products;

        if (!products) throw new Error("No products returned");

        renderProducts(products);
    } catch (e) {
        console.error("Product fetch failed:", e);
    }
}

// Render using DOM helpers (no innerHTML)
function renderProducts(products) {
    clearNode(productContainer);
    products.forEach(p => {
        const card = createProductCard(p);
        productContainer.appendChild(card);
    });
}

// Search feature
async function searchProducts(query) {
    if (!query || query.trim() === "") {
        fetchProducts(categorySelect.value || "all");
        return;
    }
    try {
        const res = await fetch(`https://dummyjson.com/products/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        renderProducts(data.products || []);
    } catch (e) {
        console.error("Search error", e);
    }
}

// attach listeners for search and category
searchInput.addEventListener("input", (e) => {
    const q = e.target.value.trim();
    // live search
    if (q.length > 0) searchProducts(q);
    else fetchProducts(categorySelect.value || "all");
});
categorySelect.addEventListener("change", () => fetchProducts(categorySelect.value));

// Initialize everything
(async function init() {
    await loadCategories();
    await fetchProducts();
    updateCartUI();
})();



document.addEventListener("DOMContentLoaded", () => {
    const fadeElements = document.querySelectorAll(".fade-up");
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add("visible");
        });
    }, {
        threshold: 0.2
    });

    fadeElements.forEach(el => observer.observe(el));
});


// --------------------------
// Global White Ripple Effect (Fixed Version)
// --------------------------
document.addEventListener("click", function (e) {
    const ripple = document.createElement("span");
    ripple.classList.add("click-ripple");

    // set click position
    ripple.style.left = `${e.clientX - 10}px`;
    ripple.style.top = `${e.clientY - 10}px`;

    document.body.appendChild(ripple);

    // remove ripple after animation ends
    setTimeout(() => {
        ripple.remove();
    }, 800);
});
