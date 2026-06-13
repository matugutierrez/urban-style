// ─── PRODUCT DETAIL FULL-SCREEN OVERLAY ───
let modalProducto = null;
let talleSeleccionado = null;
let modalCantidad = 1;
let infoTabActivo = 'descripcion';

function crearModalProducto() {
    modalProducto = document.createElement('div');
    modalProducto.className = 'producto-modal';
    modalProducto.id = 'productoModal';
    modalProducto.innerHTML = `
        <div class="modal-backdrop"></div>
        <div class="modal-contenido">
            <div class="modal-topbar">
                <span class="modal-cerrar">&times;</span>
                <span class="modal-breadcrumb" id="modalBreadcrumb">Producto</span>
            </div>
            <div class="modal-scroll">
                <div class="modal-main">
                    <div class="modal-imagenes">
                        <div class="modal-img-principal-wrapper">
                            <img id="modalImgPrincipal" class="modal-img-principal" src="" alt="">
                        </div>
                        <div id="modalThumbs" class="modal-thumbs"></div>
                    </div>
                    <div class="modal-info">
                        <p class="modal-categoria" id="modalCategoria"></p>
                        <h2 id="modalNombre"></h2>
                        <p class="modal-precio" id="modalPrecio"></p>
                        <p class="modal-cuotas" id="modalCuotas"></p>
                        <p class="modal-stock" id="modalStock"></p>

                        <div class="modal-colores">
                            <label>Color: <span id="modalColorLabel">Único</span></label>
                            <div class="color-opciones">
                                <span class="color-btn active" style="background:#000;" title="Negro"></span>
                                <span class="color-btn" style="background:#fff;border:1.5px solid #ddd;" title="Blanco"></span>
                                <span class="color-btn" style="background:#808080;" title="Gris"></span>
                            </div>
                        </div>

                        <div class="modal-talles">
                            <div class="talle-header">
                                <label>Talle <span id="talleRequired" class="talle-required">* Seleccioná un talle</span></label>
                                <a href="#" class="talle-guia" id="btnGuiaTalles">Guía de talles</a>
                            </div>
                            <div id="modalTallesContainer" class="talle-opciones"></div>
                        </div>

                        <div class="modal-cantidad">
                            <label>Cantidad</label>
                            <div class="cantidad-selector">
                                <button id="btnCantMenos">−</button>
                                <span id="modalCantidadDisplay">1</span>
                                <button id="btnCantMas">+</button>
                            </div>
                        </div>

                        <p class="modal-envio"><strong>Envío a todo el país</strong> | gratis en compras mayores a $50.000</p>
                        <button id="modalAgregar" class="btn-modal-agregar">AGREGAR AL CARRITO</button>
                    </div>
                </div>

                <div class="modal-detalles">
                    <div class="detalles-tabs">
                        <button class="detalles-tab active" data-tab="descripcion">Descripción</button>
                        <button class="detalles-tab" data-tab="cuidados">Cuidados</button>
                        <button class="detalles-tab" data-tab="envio">Envío</button>
                    </div>
                    <div class="detalles-panels">
                        <div class="detalles-panel active" id="detalleDescripcion">
                            <p id="modalDescripcion"></p>
                        </div>
                        <div class="detalles-panel" id="detalleCuidados">
                            <ul>
                                <li>Lavar con agua fría</li>
                                <li>No usar lavandina</li>
                                <li>Secar a la sombra</li>
                                <li>Planchar a temperatura media</li>
                            </ul>
                        </div>
                        <div class="detalles-panel" id="detalleEnvio">
                            <p><strong>Envíos a todo el país</strong> a través de Correo Argentino y motos en CABA/GBA.</p>
                            <p style="margin-top:8px;"><strong>Plazos de entrega:</strong> de 3 a 7 días hábiles según destino.</p>
                            <p style="margin-top:8px;"><strong>Cambios y devoluciones:</strong> hasta 30 días desde la compra.</p>
                        </div>
                    </div>
                </div>

                <div class="modal-relacionados">
                    <h3>Completá tu look</h3>
                    <div class="relacionados-grid" id="modalRelacionados"></div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modalProducto);

    modalProducto.querySelector('.modal-backdrop').addEventListener('click', cerrarModalProducto);
    modalProducto.querySelector('.modal-cerrar').addEventListener('click', cerrarModalProducto);

    // Guía de talles
    document.getElementById('btnGuiaTalles').addEventListener('click', (e) => {
        e.preventDefault();
        mostrarGuiaTalles();
    });

    // Color selector
    modalProducto.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            modalProducto.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('modalColorLabel').textContent = btn.getAttribute('title') || 'Único';
        });
    });

    // Cantidad
    document.getElementById('btnCantMenos').addEventListener('click', () => {
        if (modalCantidad > 1) {
            modalCantidad--;
            document.getElementById('modalCantidadDisplay').textContent = modalCantidad;
        }
    });
    document.getElementById('btnCantMas').addEventListener('click', () => {
        const maxStock = parseInt(modalProducto.getAttribute('data-max-stock') || '10');
        if (modalCantidad < maxStock) {
            modalCantidad++;
            document.getElementById('modalCantidadDisplay').textContent = modalCantidad;
        }
    });

    // Info tabs
    document.querySelectorAll('.detalles-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.detalles-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.detalles-panel').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            const panel = document.getElementById('detalle' + tab.dataset.tab.charAt(0).toUpperCase() + tab.dataset.tab.slice(1));
            if (panel) panel.classList.add('active');
        });
    });

    // Add to cart
    modalProducto.querySelector('#modalAgregar').addEventListener('click', () => {
        if (!talleSeleccionado) {
            document.getElementById('talleRequired').style.color = '#e74c3c';
            return;
        }
        const id = modalProducto.getAttribute('data-product-id');
        if (!id) return;

        let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
        const prod = productos.find(p => p.id === id);
        if (!prod) return;

        const itemKey = id + '-' + talleSeleccionado;
        const existing = carrito.findIndex(i => (i.id + '-' + (i.talle || '')) === itemKey);
        const existingCantidad = existing > -1 ? carrito[existing].cantidad : 0;
        const stockDisponible = prod.stock ?? 0;
        const maxAgregar = Math.max(0, stockDisponible - existingCantidad);
        if (maxAgregar <= 0) {
            const toast = document.getElementById('toastCart');
            if (toast) {
                const toastMsg = toast.querySelector('.toast-message');
                toastMsg.textContent = `¡No hay más stock disponible de ${prod.nombre} (${talleSeleccionado})!`;
                toast.style.background = '#e74c3c';
                toast.classList.add('active');
                setTimeout(() => { toast.classList.remove('active'); toast.style.background = ''; }, 3000);
            }
            return;
        }
        const agregar = Math.min(modalCantidad, maxAgregar);
        if (existing > -1) {
            carrito[existing].cantidad += agregar;
        } else {
            carrito.push({ ...prod, cantidad: agregar, talle: talleSeleccionado });
        }
        localStorage.setItem('carrito', JSON.stringify(carrito));

        const toast = document.getElementById('toastCart');
        if (toast) {
            const toastMsg = toast.querySelector('.toast-message');
            toastMsg.textContent = `¡${prod.nombre} (${talleSeleccionado}) x${agregar} agregado!`;
            toast.style.background = '';
            toast.classList.add('active');
            setTimeout(() => toast.classList.remove('active'), 3000);
        }
        if (typeof actualizarBadgeCarrito === 'function') actualizarBadgeCarrito();

        cerrarModalProducto();
    });
}

function mostrarGuiaTalles() {
    const overlay = document.createElement('div');
    overlay.className = 'guia-overlay';
    overlay.innerHTML = `
        <div class="guia-backdrop"></div>
        <div class="guia-modal">
            <span class="guia-cerrar">&times;</span>
            <h3>Guía de Talles</h3>
            <table>
                <tr><th>Talle</th><th>Largo (cm)</th><th>Pecho (cm)</th><th>Cintura (cm)</th></tr>
                <tr><td>S</td><td>68</td><td>96</td><td>86</td></tr>
                <tr><td>M</td><td>70</td><td>100</td><td>90</td></tr>
                <tr><td>L</td><td>72</td><td>104</td><td>94</td></tr>
                <tr><td>XL</td><td>74</td><td>108</td><td>98</td></tr>
                <tr><td>XXL</td><td>76</td><td>112</td><td>102</td></tr>
                <tr><td>XXXL</td><td>78</td><td>116</td><td>106</td></tr>
            </table>
            <p style="margin-top:12px;font-size:12px;color:#999;">* Las medidas son aproximadas. Podés variar ±2cm.</p>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('.guia-backdrop').addEventListener('click', () => overlay.remove());
    overlay.querySelector('.guia-cerrar').addEventListener('click', () => overlay.remove());
    overlay.classList.add('active');
}

function abrirModalProducto(id) {
    const prod = productos.find(p => p.id === id);
    if (!prod) return;

    talleSeleccionado = null;
    modalCantidad = 1;
    document.getElementById('modalCantidadDisplay').textContent = 1;
    modalProducto.setAttribute('data-product-id', id);
    modalProducto.setAttribute('data-max-stock', prod.stock ?? 10);

    const precioFormateado = new Intl.NumberFormat('es-AR', {
        style: 'currency', currency: 'ARS', minimumFractionDigits: 0
    }).format(prod.precio).replace("ARS", "$");

    const valorCuota = Math.ceil(prod.precio / prod.cuotasCon);

    const catLabel = { remeras: 'Remeras', buzos: 'Buzos', pantalones: 'Pantalones' }[prod.categoria] || prod.categoria;

    document.getElementById('modalBreadcrumb').textContent = `Inicio / ${catLabel} / ${prod.nombre}`;
    document.getElementById('modalImgPrincipal').src = prod.imagen;
    document.getElementById('modalCategoria').textContent = catLabel.toUpperCase();
    document.getElementById('modalNombre').textContent = prod.nombre;
    document.getElementById('modalPrecio').textContent = precioFormateado;
    document.getElementById('modalCuotas').textContent = `Hasta ${prod.cuotasCon} cuotas sin interés de $${valorCuota.toLocaleString('es-AR')}`;

    // Indicador de stock
    const stockEl = document.getElementById('modalStock');
    const stock = prod.stock ?? 0;
    stockEl.className = 'modal-stock';
    if (stock <= 0) {
        stockEl.textContent = 'Sin stock';
        stockEl.classList.add('stock-none');
        document.getElementById('modalAgregar').disabled = true;
        document.getElementById('modalAgregar').style.opacity = '0.5';
        document.getElementById('modalAgregar').style.cursor = 'not-allowed';
    } else if (stock === 1) {
        stockEl.textContent = '¡Última unidad!';
        stockEl.classList.add('stock-critical');
        document.getElementById('modalAgregar').disabled = false;
        document.getElementById('modalAgregar').style.opacity = '';
        document.getElementById('modalAgregar').style.cursor = '';
    } else if (stock <= 5) {
        stockEl.textContent = `Últimas unidades (quedan ${stock})`;
        stockEl.classList.add('stock-warn');
        document.getElementById('modalAgregar').disabled = false;
        document.getElementById('modalAgregar').style.opacity = '';
        document.getElementById('modalAgregar').style.cursor = '';
    } else {
        stockEl.textContent = '';
        document.getElementById('modalAgregar').disabled = false;
        document.getElementById('modalAgregar').style.opacity = '';
        document.getElementById('modalAgregar').style.cursor = '';
    }

    document.getElementById('modalDescripcion').textContent = prod.descripcion;

    // Reset info tab
    document.querySelectorAll('.detalles-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.detalles-panel').forEach(p => p.classList.remove('active'));
    document.querySelector('.detalles-tab[data-tab="descripcion"]').classList.add('active');
    document.getElementById('detalleDescripcion').classList.add('active');

    // Talles
    const talleReq = document.getElementById('talleRequired');
    talleReq.style.color = '#999';
    const container = document.getElementById('modalTallesContainer');
    container.innerHTML = '';
    prod.talles.forEach(t => {
        const btn = document.createElement('button');
        btn.className = 'talle-btn';
        btn.textContent = t;
        btn.addEventListener('click', () => {
            container.querySelectorAll('.talle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            talleSeleccionado = t;
            talleReq.style.color = '#999';
        });
        container.appendChild(btn);
    });

    // Galería de imágenes
    const thumbsContainer = document.getElementById('modalThumbs');
    thumbsContainer.innerHTML = '';
    const todasImagenes = [prod.imagen, ...(prod.imagenes || [])];
    while (todasImagenes.length < 4) {
        todasImagenes.push('');
    }
    todasImagenes.forEach((imgSrc, i) => {
        const thumb = document.createElement('div');
        thumb.className = 'modal-thumb' + (i === 0 ? ' active' : '');
        if (imgSrc) {
            thumb.innerHTML = `<img src="${imgSrc}" alt="">`;
            thumb.addEventListener('click', () => {
                document.getElementById('modalImgPrincipal').src = imgSrc;
                thumbsContainer.querySelectorAll('.modal-thumb').forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
            });
        } else {
            thumb.className += ' modal-thumb-empty';
        }
        thumbsContainer.appendChild(thumb);
    });

    // Productos relacionados (misma categoría, excluir actual)
    const relacionados = productos.filter(p => p.categoria === prod.categoria && p.id !== prod.id).slice(0, 4);
    const relGrid = document.getElementById('modalRelacionados');
    relGrid.innerHTML = '';
    relacionados.forEach(r => {
        const rp = new Intl.NumberFormat('es-AR', {
            style: 'currency', currency: 'ARS', minimumFractionDigits: 0
        }).format(r.precio).replace("ARS", "$");
        const div = document.createElement('div');
        div.className = 'relacionado-item';
        div.innerHTML = `
            <div class="relacionado-img"><img src="${r.imagen}" alt="${r.nombre}" loading="lazy"></div>
            <h4>${r.nombre}</h4>
            <p>${rp}</p>
        `;
        div.addEventListener('click', () => {
            cerrarModalProducto();
            setTimeout(() => abrirModalProducto(r.id), 200);
        });
        relGrid.appendChild(div);
    });

    modalProducto.classList.add('active');
    document.body.style.overflow = 'hidden';
    // Scroll to top
    modalProducto.querySelector('.modal-scroll').scrollTop = 0;
}

function cerrarModalProducto() {
    modalProducto.classList.remove('active');
    document.body.style.overflow = '';
    talleSeleccionado = null;
    modalCantidad = 1;
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalProducto && modalProducto.classList.contains('active')) {
        cerrarModalProducto();
    }
});

const btnBuscar = document.getElementById("btnBuscar");

const searchMenu =
document.querySelector(".search-menu");

const closeSearch =
document.querySelector(".close-search");

btnBuscar.addEventListener("click", (e) => {

    e.preventDefault();

    searchMenu.classList.add("active");

});

closeSearch.addEventListener("click", () => {

    searchMenu.classList.remove("active");

});

// Función global para actualizar la cantidad del carrito en el badge de la barra de navegación
function actualizarBadgeCarrito() {
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const totalCantidad = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    
    const cartIconLink = document.querySelector('header .icons a[href="carrito.html"]');
    if (cartIconLink) {
        const badgeExistente = cartIconLink.querySelector('.cart-badge');
        if (badgeExistente) {
            badgeExistente.remove();
        }
        
        if (totalCantidad > 0) {
            cartIconLink.innerHTML = `🛒<span class="cart-badge">${totalCantidad}</span>`;
            const badge = cartIconLink.querySelector('.cart-badge');
            badge.classList.add('pulse');
            setTimeout(() => badge.classList.remove('pulse'), 400);
        } else {
            cartIconLink.innerHTML = `🛒`;
        }
    }
}

// Ejecutar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    actualizarBadgeCarrito();
    crearModalProducto();
});

// Escuchar tecla Enter en el input de búsqueda global
const searchInput = document.querySelector(".search-input");
if (searchInput) {
    searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            const query = searchInput.value.trim();
            if (query) {
                // Cerrar el buscador
                const searchMenu = document.querySelector(".search-menu");
                if (searchMenu) {
                    searchMenu.classList.remove("active");
                }
                // Redirigir a buscar.html con el parámetro q
                window.location.href = "buscar.html?q=" + encodeURIComponent(query);
            }
        }
    });
}
