(function () {
    const FALLBACK_PRODUCTS = [
        { "id": "rem-1", "nombre": "Remera Oversize Negra", "categoria": "remeras", "subcategoria": "oversize", "precio": 39990, "descripcion": "Remera oversize de algodón premium. Corte relajado.", "talles": ["S","M","L","XL","XXL","XXXL"], "cuotasCon": 6, "stock": 1 },
        { "id": "rem-2", "nombre": "Remera Urban White", "categoria": "remeras", "subcategoria": "estampadas", "precio": 29990, "descripcion": "Remera estampada con diseño urbano. Fresca y versátil.", "talles": ["S","M","L","XL","XXL","XXXL"], "cuotasCon": 6, "stock": 60 },
        { "id": "rem-3", "nombre": "Remera Classic White", "categoria": "remeras", "subcategoria": "lisas", "precio": 24990, "descripcion": "Remera lisa clásica, básica y esencial. Algodón suave.", "talles": ["S","M","L","XL","XXL","XXXL"], "cuotasCon": 6, "stock": 60 },
        { "id": "rem-4", "nombre": "Remera Heavyweight Grey", "categoria": "remeras", "subcategoria": "oversize", "precio": 38990, "descripcion": "Remera heavyweight con corte oversize. Tela gruesa.", "talles": ["S","M","L","XL","XXL","XXXL"], "cuotasCon": 6, "stock": 60 },
        { "id": "rem-5", "nombre": "Remera Yellow Acid Wash", "categoria": "remeras", "subcategoria": "estampadas", "precio": 36990, "descripcion": "Remera acid wash amarilla. Look desgastado.", "talles": ["S","M","L","XL","XXL","XXXL"], "cuotasCon": 6, "stock": 60 },
        { "id": "rem-6", "nombre": "Remera Basic Black", "categoria": "remeras", "subcategoria": "lisas", "precio": 23990, "descripcion": "Remera negra lisa, el must-have. Algodón peinado.", "talles": ["S","M","L","XL","XXL","XXXL"], "cuotasCon": 6, "stock": 60 },
        { "id": "rem-7", "nombre": "Remera Streetwear Olive", "categoria": "remeras", "subcategoria": "oversize", "precio": 41990, "descripcion": "Remera streetwear color oliva. Corte oversize.", "talles": ["S","M","L","XL","XXL","XXXL"], "cuotasCon": 6, "stock": 60 },
        { "id": "rem-8", "nombre": "Remera Vintage Graphic", "categoria": "remeras", "subcategoria": "estampadas", "precio": 34990, "descripcion": "Remera con gráfica vintage. Estilo retro.", "talles": ["S","M","L","XL","XXL","XXXL"], "cuotasCon": 6, "stock": 60 },
        { "id": "buz-1", "nombre": "Buzo Premium Hoodie", "categoria": "buzos", "subcategoria": "hoodies", "precio": 59990, "descripcion": "Buzo con capucha premium. Interior fleece.", "talles": ["S","M","L","XL","XXL","XXXL"], "cuotasCon": 6, "stock": 60 },
        { "id": "buz-2", "nombre": "Buzo Oversize Off-White", "categoria": "buzos", "subcategoria": "oversize", "precio": 64990, "descripcion": "Buzo oversize off-white. Corte amplio.", "talles": ["S","M","L","XL","XXL","XXXL"], "cuotasCon": 6, "stock": 60 },
        { "id": "buz-3", "nombre": "Buzo Classic Black Crewneck", "categoria": "buzos", "subcategoria": "crewnecks", "precio": 49990, "descripcion": "Buzo clásico negro cuello redondo.", "talles": ["S","M","L","XL","XXL","XXXL"], "cuotasCon": 6, "stock": 60 },
        { "id": "buz-4", "nombre": "Hoodie Streetwear Graphic", "categoria": "buzos", "subcategoria": "hoodies", "precio": 58990, "descripcion": "Hoodie con diseño gráfico streetwear.", "talles": ["S","M","L","XL","XXL","XXXL"], "cuotasCon": 6, "stock": 60 },
        { "id": "buz-5", "nombre": "Buzo Acid Wash Crewneck", "categoria": "buzos", "subcategoria": "crewnecks", "precio": 52990, "descripcion": "Buzo crewneck acid wash.", "talles": ["S","M","L","XL","XXL","XXXL"], "cuotasCon": 6, "stock": 60 },
        { "id": "buz-6", "nombre": "Buzo Oversize Beige", "categoria": "buzos", "subcategoria": "oversize", "precio": 62990, "descripcion": "Buzo oversize beige. Corte holgado.", "talles": ["S","M","L","XL","XXL","XXXL"], "cuotasCon": 6, "stock": 60 },
        { "id": "pan-1", "nombre": "Pantalón Cargo Black", "categoria": "pantalones", "subcategoria": "cargo", "precio": 54990, "descripcion": "Pantalón cargo negro con múltiples bolsillos.", "talles": ["36","38","40","42","44","46","48","50"], "cuotasCon": 6, "stock": 80 },
        { "id": "pan-2", "nombre": "Jogger Heavyweight Grey", "categoria": "pantalones", "subcategoria": "joggers", "precio": 48990, "descripcion": "Jogger heavyweight gris. Puños ajustados.", "talles": ["36","38","40","42","44","46","48","50"], "cuotasCon": 6, "stock": 80 },
        { "id": "pan-3", "nombre": "Jeans Wide Leg Classic", "categoria": "pantalones", "subcategoria": "jeans", "precio": 59990, "descripcion": "Jeans wide leg clásicos. Denim de alta calidad.", "talles": ["36","38","40","42","44","46","48","50"], "cuotasCon": 6, "stock": 80 },
        { "id": "pan-4", "nombre": "Pantalón Cargo Olive", "categoria": "pantalones", "subcategoria": "cargo", "precio": 56990, "descripcion": "Pantalón cargo verde oliva. Estilo militar.", "talles": ["36","38","40","42","44","46","48","50"], "cuotasCon": 6, "stock": 80 },
        { "id": "pan-5", "nombre": "Jogger Streetwear Black", "categoria": "pantalones", "subcategoria": "joggers", "precio": 46990, "descripcion": "Jogger negro streetwear. Algodón fleece.", "talles": ["36","38","40","42","44","46","48","50"], "cuotasCon": 6, "stock": 80 },
        { "id": "pan-6", "nombre": "Jeans Carpenter Vintage", "categoria": "pantalones", "subcategoria": "jeans", "precio": 61990, "descripcion": "Jeans carpenter estilo vintage.", "talles": ["36","38","40","42","44","46","48","50"], "cuotasCon": 6, "stock": 80 }
    ];

    let chatProducts = [];
    let productsLoaded = false;

    function ensureProducts() {
        if (productsLoaded) return true;
        if (window.productos && Array.isArray(productos) && productos.length) {
            chatProducts = productos;
            productsLoaded = true;
            return true;
        }
        chatProducts = FALLBACK_PRODUCTS;
        productsLoaded = true;
        return true;
    }

    try {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', '/api/productos', true);
        xhr.onload = function () {
            if (xhr.status === 200) {
                var data = JSON.parse(xhr.responseText);
                if (Array.isArray(data) && data.length) {
                    chatProducts = data;
                }
            }
        };
        xhr.send();
    } catch (e) {}

    const CATEGORY_MAP = {
        remeras: 'Remeras',
        buzos: 'Buzos',
        pantalones: 'Pantalones'
    };

    function formatPrice(n) {
        return '$' + Math.round(n).toLocaleString('es-AR');
    }

    function normalize(str) {
        return str.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s]/g, '').trim();
    }

    function findProducts(query) {
        ensureProducts();
        if (!chatProducts.length) return [];
        const nq = normalize(query);
        return chatProducts.filter(p => {
            const name = normalize(p.nombre);
            const cat = normalize(CATEGORY_MAP[p.categoria] || p.categoria);
            const sub = normalize(p.subcategoria || '');
            return name.includes(nq) || cat.includes(nq) || sub.includes(nq) || nq.includes(name);
        });
    }

    function getCategoryProducts(catKey) {
        ensureProducts();
        return chatProducts.filter(p => p.categoria === catKey);
    }

    function productToList(p) {
        const price = formatPrice(p.precio);
        const stockLabel = p.stock > 5 ? '' : (p.stock > 0 ? ' (Últimas unidades!)' : ' (Sin stock)');
        return `• <b>${p.nombre}</b> — ${price}${stockLabel}`;
    }

    function handleProductQuery(text) {
        const lower = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const nq = normalize(text);

        ensureProducts();
        if (!chatProducts.length) {
            return { text: '⏳ Los productos están cargándose. Esperá un momento y volvé a preguntar.', options: null };
        }

        // ─── Producto más barato / económico ───
        if (/\b(?:mas\s)?barato|mas\s?economico|menor\s?precio|mas\s?chico\s?precio\b/.test(nq)
            && !/(?:talle|medida|guia)/.test(nq)) {
            const catMatch = nq.match(/(remeras?|buzos?|pantalones?|pantalon)/);
            let pool = chatProducts;
            if (catMatch) {
                const key = catMatch[1].replace(/s$/, '') + 's';
                if (CATEGORY_MAP[key]) pool = getCategoryProducts(key);
            }
            const sorted = [...pool].filter(p => p.activo !== false).sort((a, b) => a.precio - b.precio);
            if (!sorted.length) return { text: 'No encontré productos en esa categoría.', options: null };
            const cheapest = sorted.slice(0, 3);
            const catLabel = catMatch ? ` en ${CATEGORY_MAP[catMatch[1].replace(/s$/, '') + 's'] || catMatch[1]}` : '';
            let resp = `💰 El producto más barato${catLabel} es <b>${cheapest[0].nombre}</b> — ${formatPrice(cheapest[0].precio)}`;
            if (cheapest.length > 1) {
                resp += `<br><br>Otros económicos:<br>`;
                cheapest.slice(1).forEach(p => resp += productToList(p) + '<br>');
            }
            return { text: resp, options: QUICK_OPTIONS };
        }

        // ─── Producto más caro ───
        if (/\b(?:mas\s)?caro|mayor\s?precio|mas\s?grande\s?precio\b/.test(nq)) {
            const catMatch = nq.match(/(remeras?|buzos?|pantalones?|pantalon)/);
            let pool = chatProducts;
            if (catMatch) {
                const key = catMatch[1].replace(/s$/, '') + 's';
                if (CATEGORY_MAP[key]) pool = getCategoryProducts(key);
            }
            const sorted = [...pool].filter(p => p.activo !== false).sort((a, b) => b.precio - a.precio);
            if (!sorted.length) return { text: 'No encontré productos en esa categoría.', options: null };
            const catLabel = catMatch ? ` en ${CATEGORY_MAP[catMatch[1].replace(/s$/, '') + 's'] || catMatch[1]}` : '';
            return { text: `💎 El producto más caro${catLabel} es <b>${sorted[0].nombre}</b> — ${formatPrice(sorted[0].precio)}`, options: QUICK_OPTIONS };
        }

        // ─── Rango de precio ───
        const rangeMatch = nq.match(/(?:entre|de)\s*(\d{3,})[.\s]*(?:\s*a\s*|\s*(-)\s*|y)\s*(\d{3,})/);
        if (rangeMatch) {
            const min = parseInt(rangeMatch[1]);
            const max = parseInt(rangeMatch[3] || rangeMatch[2]);
            const matches = chatProducts.filter(p => p.activo !== false && p.precio >= min && p.precio <= max)
                .sort((a, b) => a.precio - b.precio);
            if (!matches.length) return { text: `No encontré productos entre ${formatPrice(min)} y ${formatPrice(max)}.`, options: QUICK_OPTIONS };
            let resp = `Encontré <b>${matches.length} producto${matches.length > 1 ? 's' : ''}</b> entre ${formatPrice(min)} y ${formatPrice(max)}:<br><br>`;
            matches.slice(0, 8).forEach(p => resp += productToList(p) + '<br>');
            if (matches.length > 8) resp += `<br>...y ${matches.length - 8} más.`;
            return { text: resp, options: QUICK_OPTIONS };
        }

        // ─── Mostrar categoría (remeras, buzos, pantalones) ───
        const catQuery = nq.match(/(?:mostrame?|quiero\s?ver|lista|tienen?|hay|mostrar|que\s?hay\s?de)\s*(remeras?|buzos?|pantalones?|pantalon)/);
        if (catQuery) {
            const catName = catQuery[1].replace(/s$/, '') + 's';
            const catLabel = CATEGORY_MAP[catName];
            if (!catLabel) return null;
            const items = getCategoryProducts(catName).sort((a, b) => a.precio - b.precio);
            if (!items.length) return { text: `No hay productos disponibles en ${catLabel} en este momento.`, options: QUICK_OPTIONS };
            const labels = { remeras: '🏷️', buzos: '🧥', pantalones: '👖' };
            let resp = `${labels[catName] || '📋'} <b>${catLabel}</b> — ${items.length} producto${items.length > 1 ? 's' : ''}:<br><br>`;
            items.forEach(p => resp += productToList(p) + '<br>');
            return { text: resp, options: QUICK_OPTIONS };
        }

        // ─── "Qué productos tienen" / "catálogo" / "productos" ───
        if (/^(?:que\s?productos\s?tienen?|catalogo|listado|todos\s?los\s?productos|que\s?venden?|productos)$/.test(nq)) {
            const cats = ['remeras', 'buzos', 'pantalones'];
            let resp = '📋 <b>Nuestro catálogo completo:</b><br><br>';
            cats.forEach(cat => {
                const items = getCategoryProducts(cat);
                if (items.length) {
                    resp += `<b>${CATEGORY_MAP[cat]}</b> (${items.length}):<br>`;
                    items.forEach(p => resp += productToList(p) + '<br>');
                    resp += '<br>';
                }
            });
            return { text: resp, options: QUICK_OPTIONS };
        }

        // ─── Buscar producto por nombre ───
        const productNames = chatProducts.filter(p => p.activo !== false).map(p => normalize(p.nombre));
        let matchedProduct = null;
        for (const p of chatProducts) {
            const np = normalize(p.nombre);
            if (nq.includes(np) || np.split(/\s+/).some(word => word.length > 2 && nq.includes(word))) {
                matchedProduct = p;
                break;
            }
        }

        if (matchedProduct) {
            const p = matchedProduct;
            const price = formatPrice(p.precio);

            // ─── "Qué talles" / "talles de" ───
            if (/(?:que\s?talles|talles?\s?disponibles|talles?\s?de|medidas?)(?:\s*de|\s*para|\s*del)?/.test(nq)) {
                const talles = p.talles || [];
                return { text: `📏 <b>${p.nombre}</b> — Talles disponibles:<br><br>${talles.join(' — ')}`, options: QUICK_OPTIONS };
            }

            // ─── "Hay stock" / "stock de" / "disponible" ───
            if (/(?:hay\s?stock|stock\s?de|disponible|queda)/.test(nq)) {
                const stock = p.stock ?? 0;
                if (stock <= 0) return { text: `❌ <b>${p.nombre}</b> — Sin stock en este momento.`, options: QUICK_OPTIONS };
                let resp = `✅ <b>${p.nombre}</b> — Hay <b>${stock} unidad${stock > 1 ? 'es' : ''}</b> disponible${stock > 1 ? 's' : ''}.`;
                if (p.stockPorTalle) {
                    const detalles = Object.entries(p.stockPorTalle)
                        .filter(([, qty]) => qty > 0)
                        .map(([t, qty]) => `${t}: ${qty}`).join(' | ');
                    if (detalles) resp += `<br><br>Stock por talle:<br>${detalles}`;
                }
                return { text: resp, options: QUICK_OPTIONS };
            }

            // ─── "Cuánto cuesta" / "precio" ───
            if (/(?:cuanto\s?cuesta|cuanto\s?sale|precio\s?de|que\s?precio|cual\s?es\s?el\s?precio)/.test(nq)) {
                const cuota = Math.ceil(p.precio / p.cuotasCon);
                return { text: `💰 <b>${p.nombre}</b> — ${price}<br>📆 Hasta ${p.cuotasCon} cuotas sin interés de ${formatPrice(cuota)}`, options: QUICK_OPTIONS };
            }

            // ─── Info general del producto ───
            const cuota = Math.ceil(p.precio / p.cuotasCon);
            const stockLabel = p.stock <= 0 ? '❌ Sin stock' : (p.stock <= 5 ? `⚠️ Últimas unidades (${p.stock})` : `✅ En stock (${p.stock})`);
            let resp = `<b>${p.nombre}</b><br><br>`;
            resp += `💰 ${price}<br>`;
            resp += `📆 ${p.cuotasCon} cuotas sin interés de ${formatPrice(cuota)}<br>`;
            resp += `📦 ${stockLabel}<br>`;
            resp += `📏 Talles: ${p.talles.join(', ')}<br>`;
            resp += `<br>${p.descripcion}`;
            return { text: resp, options: QUICK_OPTIONS };
        }

        return null;
    }

    const AI_RESPONSES = [
        {
            keywords: ['hola', 'buenas', 'buen día', 'buenas tardes', 'buenas noches', 'hey', 'hello', 'hi'],
            response: '¡Hola! Soy el asistente virtual de <b>URBAN</b>. Estoy acá para ayudarte. Podés preguntarme sobre productos, precios, stock, envíos y más. 😊'
        },
        {
            keywords: ['envio', 'envío', 'entrega', 'demora', 'tarda', 'llegar', 'correo', 'paquete'],
            response: '📦 <b>Envíos:</b><br>Hacemos envíos a todo el país. El plazo de entrega es de <b>3 a 7 días hábiles</b>. El costo se calcula al finalizar la compra según tu ubicación. Los pedidos superiores a <b>$50.000</b> tienen envío gratis 🚚'
        },
        {
            keywords: ['cambio', 'devolucion', 'devolución', 'cambiar', 'volver', 'reembolso'],
            response: '🔄 <b>Cambios y devoluciones:</b><br>Tenés hasta <b>30 días</b> desde que recibís tu pedido para realizar cambios. El producto debe estar en su estado original (sin usar, con etiquetas). Iniciá tu cambio desde Soporte o escribinos por WhatsApp.'
        },
        {
            keywords: ['pago', 'tarjeta', 'mercado pago', 'cuota', 'cuotas', 'transferencia', 'efectivo', 'debito', 'crédito', 'credito'],
            response: '💳 <b>Medios de pago:</b><br>Aceptamos:<br>• Tarjetas de crédito y débito (Visa, Mastercard, Amex)<br>• Mercado Pago<br>• Transferencia bancaria<br>• Hasta <b>6 cuotas sin interés</b> con tarjetas bancarias 🏦'
        },
        {
            keywords: ['talle', 'medida', 'guia', 'talla'],
            response: '📏 <b>Guía de talles:</b><br>Tenemos talles desde <b>S hasta XXXL</b> en remeras y buzos, y del <b>36 al 50</b> en pantalones. Si querés saber los talles de un producto en particular, decime el nombre y te los digo.'
        },
        {
            keywords: ['cuenta', 'registro', 'login', 'inicar', 'sesion', 'contraseña', 'password', 'usuario', 'perfil'],
            response: '👤 <b>Mi cuenta:</b><br>Podés registrarte o iniciar sesión desde <b>"Mi cuenta"</b> en el menú superior. Allí podés ver tus pedidos y modificar tus datos. Si olvidaste tu contraseña, podés recuperarla desde la misma pantalla.'
        },
        {
            keywords: ['gracias', 'graci', 'vale', 'ok', 'perfecto', 'genial', 'joya', 'bueno'],
            response: '¡De nada! 😊 Me alegra haber podido ayudarte. Si tenés cualquier otra consulta, estoy acá. ¡Que tengas un excelente día! 🖤'
        },
        {
            keywords: ['horario', 'atencion', 'atención', 'contacto', 'hablar', 'whatsapp', 'persona', 'humano'],
            response: '🕐 <b>Atención al cliente:</b><br>Lunes a Sábados de 9:00 a 20:00 hs.<br>📱 WhatsApp: 11-XXXX-XXXX<br>📧 Email: soporte@urbanstyle.com<br>También podés usar el formulario en <b>Soporte</b>.'
        }
    ];

    const FALLBACK = 'Entiendo tu consulta. Te recomiendo visitar <b><a href="soporte.html" style="color:black;text-decoration:underline;">Soporte</a></b> para más info, o contactarnos por <b>WhatsApp</b> al 11-XXXX-XXXX. ¿Hay algo más en lo que pueda ayudarte?';

    const QUICK_OPTIONS = [
        { label: '📦 Envíos', keywords: 'envio' },
        { label: '🔄 Cambios', keywords: 'cambio' },
        { label: '💳 Medios de pago', keywords: 'pago' },
        { label: '💰 Producto más barato', keywords: 'barato' },
        { label: '👕 Ver remeras', keywords: 'remeras' },
        { label: '🧥 Ver buzos', keywords: 'buzos' },
        { label: '👖 Ver pantalones', keywords: 'pantalones' }
    ];

    const WELCOME_MSG = {
        text: '👋 ¡Hola! Soy <b>URBAN AI</b>, tu asistente virtual.<br><br>Podés preguntarme:<br>• 💰 "Producto más barato"<br>• 👕 "Mostrame remeras"<br>• 📏 "Qué talles tiene ..."<br>• 📦 Consultas sobre envíos, cambios, etc.<br><br>Elegí una opción o escribime:',
        options: QUICK_OPTIONS
    };

    let chatHTML = `
        <div class="chat-widget" id="chatWidget">
            <div class="chat-bubble" id="chatBubble">
                <div class="chat-bubble-icon">
                    <span class="brand-text">URBAN</span>
                    <span class="brand-sub">AI</span>
                </div>
                <div class="chat-badge-pulse"></div>
            </div>
            <div class="chat-window" id="chatWindow">
                <div class="chat-header">
                    <div class="chat-header-left">
                        <div class="chat-header-avatar">U</div>
                        <div class="chat-header-info">
                            <h4>URBAN AI</h4>
                            <p>En línea • Respondemos al instante</p>
                        </div>
                    </div>
                    <button class="chat-header-close" id="chatClose">&times;</button>
                </div>
                <div class="chat-messages" id="chatMessages"></div>
                <div class="chat-input-area">
                    <input class="chat-input" id="chatInput" type="text" placeholder="Ej: producto más barato..." autocomplete="off">
                    <button class="chat-send-btn" id="chatSend">→</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', chatHTML);

    const widget = document.getElementById('chatWidget');
    const bubble = document.getElementById('chatBubble');
    const window = document.getElementById('chatWindow');
    const closeBtn = document.getElementById('chatClose');
    const messages = document.getElementById('chatMessages');
    const input = document.getElementById('chatInput');
    const sendBtn = document.getElementById('chatSend');

    function getTime() {
        const d = new Date();
        return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
    }

    function addBotMessage(text, options) {
        const div = document.createElement('div');
        div.className = 'chat-msg bot';
        div.innerHTML = `
            <div class="chat-msg-avatar">U</div>
            <div>
                <div class="chat-msg-bubble">${text}</div>
                ${options ? `<div class="chat-options">${options.map(o => `<button class="chat-option-btn" data-keywords="${o.keywords}">${o.label}</button>`).join('')}</div>` : ''}
                <div class="chat-msg-time">${getTime()}</div>
            </div>
        `;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;

        if (options) {
            div.querySelectorAll('.chat-option-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    input.value = btn.textContent.replace(/^[^\s]+\s/, '');
                    handleUserMessage(input.value);
                });
            });
        }
    }

    function addUserMessage(text) {
        const div = document.createElement('div');
        div.className = 'chat-msg user';
        div.innerHTML = `
            <div class="chat-msg-avatar">👤</div>
            <div>
                <div class="chat-msg-bubble">${escapeHtml(text)}</div>
                <div class="chat-msg-time">${getTime()}</div>
            </div>
        `;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    }

    function showTyping() {
        const div = document.createElement('div');
        div.className = 'chat-typing';
        div.id = 'chatTyping';
        div.innerHTML = `
            <div class="chat-msg-avatar">U</div>
            <div class="chat-typing-dots"><span></span><span></span><span></span></div>
        `;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    }

    function hideTyping() {
        const el = document.getElementById('chatTyping');
        if (el) el.remove();
    }

    function escapeHtml(text) {
        const d = document.createElement('div');
        d.textContent = text;
        return d.innerHTML;
    }

    function findResponse(text) {
        const lower = text.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        for (const item of AI_RESPONSES) {
            for (const kw of item.keywords) {
                if (lower.includes(kw)) {
                    return item.response;
                }
            }
        }
        return null;
    }

    function handleUserMessage(text) {
        if (!text.trim()) return;
        addUserMessage(text);
        input.value = '';

        showTyping();

        const delay = 600 + Math.random() * 1000;
        setTimeout(() => {
            hideTyping();

            const nq = normalize(text);

            if (/^(?:remeras?|buzos?|pantalones?|pantalon)$/.test(nq)) {
                const catKey = nq.replace(/s$/, '') + 's';
                const items = getCategoryProducts(catKey).sort((a, b) => a.precio - b.precio);
                const label = CATEGORY_MAP[catKey];
                if (!items.length) {
                    addBotMessage(`No hay productos en ${label} disponibles.`, QUICK_OPTIONS);
                    return;
                }
                let resp = `👕 <b>${label}</b> (${items.length}):<br><br>`;
                items.forEach(p => resp += productToList(p) + '<br>');
                addBotMessage(resp, QUICK_OPTIONS);
                return;
            }

            const productResult = handleProductQuery(text);
            if (productResult) {
                addBotMessage(productResult.text, productResult.options);
                return;
            }

            const faqResponse = findResponse(text);
            if (faqResponse) {
                addBotMessage(faqResponse, QUICK_OPTIONS);
                return;
            }

            addBotMessage(FALLBACK, QUICK_OPTIONS);
        }, delay);
    }

    bubble.addEventListener('click', () => {
        window.classList.toggle('open');
        if (window.classList.contains('open') && messages.children.length === 0) {
            setTimeout(() => {
                addBotMessage(WELCOME_MSG.text, WELCOME_MSG.options);
            }, 300);
        }
    });

    closeBtn.addEventListener('click', () => {
        window.classList.remove('open');
    });

    function sendMessage() {
        const text = input.value.trim();
        if (text) handleUserMessage(text);
    }

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    document.addEventListener('click', (e) => {
        if (window.classList.contains('open') &&
            !widget.contains(e.target)) {
            window.classList.remove('open');
        }
    });
})();
