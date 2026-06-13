document.addEventListener('DOMContentLoaded', () => {

    const carritoVacio = document.getElementById('carritoVacio');
    const carritoGrid = document.getElementById('carritoGrid');
    const carritoItems = document.getElementById('carritoItems');
    const resumenSubtotal = document.getElementById('resumenSubtotal');
    const resumenEnvio = document.getElementById('resumenEnvio');
    const resumenTotal = document.getElementById('resumenTotal');
    const btnFinalizar = document.getElementById('btnFinalizar');
    const btnVolverCarrito = document.getElementById('btnVolverCarrito');
    const btnVolverEnvio = document.getElementById('btnVolverEnvio');
    const carritoContenido = document.getElementById('carritoContenido');
    const carritoCheckout = document.getElementById('carritoCheckout');
    const carritoExito = document.getElementById('carritoExito');
    const formCheckout = document.getElementById('formCheckout');
    const checkoutPaso1 = document.getElementById('checkoutPaso1');
    const checkoutPaso2 = document.getElementById('checkoutPaso2');
    const checkoutOrderInfo = document.getElementById('checkoutOrderInfo');

    const checkoutNombre = document.getElementById('checkoutNombre');
    const checkoutEmail = document.getElementById('checkoutEmail');
    const checkoutTelefono = document.getElementById('checkoutTelefono');
    const checkoutDireccion = document.getElementById('checkoutDireccion');
    const checkoutEnvio = document.getElementById('checkoutEnvio');
    const btnCrearOrden = document.getElementById('btnCrearOrden');

    const resumenItemsCount = document.getElementById('resumenItemsCount');
    const resumenSubtotal2 = document.getElementById('resumenSubtotal2');
    const resumenEnvio2 = document.getElementById('resumenEnvio2');
    const resumenDescuentoRow = document.getElementById('resumenDescuentoRow');
    const resumenDescuentoValor = document.getElementById('resumenDescuentoValor');
    const resumenTotal2 = document.getElementById('resumenTotal2');

    let ordenActual = null;
    let costoEnvio = 0;
    let descuentoAplicado = 0;

    const costosEnvio = { andreani: 7990, oca: 6990, 'correo-argentino': 5990, retiro: 0 };
    const labelsEnvio = { andreani: 'Andreani', oca: 'OCA', 'correo-argentino': 'Correo Argentino', retiro: 'Retiro en local' };

    function obtenerCarrito() {
        return JSON.parse(localStorage.getItem('carrito')) || [];
    }

    function guardarCarrito(carrito) {
        localStorage.setItem('carrito', JSON.stringify(carrito));
        if (typeof actualizarBadgeCarrito === 'function') actualizarBadgeCarrito();
    }

    function formatearPrecio(precio) {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency', currency: 'ARS', minimumFractionDigits: 0
        }).format(precio).replace("ARS", "$");
    }

    function renderizarCarrito() {
        const carrito = obtenerCarrito();

        // Verificar si hay un pedido pendiente de pago
        const pendingId = localStorage.getItem('pendingOrderId');
        if (pendingId) {
            fetch('/api/orders/' + pendingId)
                .then(r => r.json())
                .then(orden => {
                    if (orden && orden.pagoVerificado) {
                        localStorage.removeItem('pendingOrderId');
                        guardarCarrito([]);
                        renderizarCarrito();
                    }
                })
                .catch(() => {});
        }

        if (carrito.length === 0) {
            if (localStorage.getItem('pendingOrderId')) {
                carritoVacio.innerHTML = '<div style="text-align:center;padding:60px 20px;"><div style="font-size:48px;margin-bottom:16px;">⏳</div><h3 style="font-size:20px;margin-bottom:8px;">Pedido pendiente</h3><p style="color:#666;font-size:14px;margin-bottom:4px;">Ya realizaste un pedido que está siendo procesado.</p><p style="color:#999;font-size:13px;">Te enviaremos un email cuando el pago sea confirmado.</p></div>';
                carritoVacio.style.display = 'block';
                carritoGrid.style.display = 'none';
                return;
            }
            carritoVacio.style.display = 'block';
            carritoGrid.style.display = 'none';
            return;
        }
        carritoVacio.style.display = 'none';
        carritoGrid.style.display = 'grid';
        carritoItems.innerHTML = '';
        let subtotal = 0;
        carrito.forEach((item, index) => {
            const precioTotal = item.precio * item.cantidad;
            subtotal += precioTotal;
            const div = document.createElement('div');
            div.className = 'carrito-item';
            div.innerHTML = `
                <div class="carrito-item-img"><img src="${item.imagen}" alt="${item.nombre}" loading="lazy"></div>
                <div class="carrito-item-info">
                    <h4>${item.nombre}</h4>
                    ${item.talle ? `<p style="font-size:12px;color:#999;">Talle: ${item.talle}</p>` : ''}
                    <p class="carrito-item-precio">${formatearPrecio(item.precio)}</p>
                </div>
                <div class="carrito-item-cantidad">
                    <button class="cantidad-btn" data-index="${index}" data-action="restar">−</button>
                    <span class="cantidad-valor">${item.cantidad}</span>
                    <button class="cantidad-btn" data-index="${index}" data-action="sumar">+</button>
                </div>
                <div class="carrito-item-total">${formatearPrecio(precioTotal)}</div>
                <button class="carrito-item-eliminar" data-index="${index}">✕</button>
            `;
            carritoItems.appendChild(div);
        });
        const envio = subtotal >= 50000 ? 0 : 5990;
        const total = subtotal + envio;
        resumenSubtotal.textContent = formatearPrecio(subtotal);
        resumenEnvio.textContent = subtotal >= 50000 ? 'GRATIS' : formatearPrecio(envio);
        resumenTotal.textContent = formatearPrecio(total);

        document.querySelectorAll('.cantidad-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const index = parseInt(e.target.dataset.index);
                const action = e.target.dataset.action;
                let carrito = obtenerCarrito();
                if (action === 'sumar') {
                    const item = carrito[index];
                    if (item) {
                        const toast = document.getElementById('toastCart');
                        try {
                            const res = await fetch('/api/productos');
                            const prods = await res.json();
                            const prod = prods.find(p => p.id === item.id);
                            const stock = prod ? (prod.stock ?? 0) : (item.stock ?? 0);
                            if (item.cantidad >= stock) {
                                if (toast) {
                                    const toastMsg = toast.querySelector('.toast-message');
                                    if (toastMsg) toastMsg.textContent = `Stock máximo: ${stock} para "${item.nombre}".`;
                                    toast.style.background = '#e74c3c';
                                    toast.classList.add('active');
                                    setTimeout(() => { toast.classList.remove('active'); toast.style.background = ''; }, 2500);
                                }
                                return;
                            }
                        } catch {
                            if (item.cantidad >= (item.stock ?? 0)) {
                                if (toast) {
                                    const toastMsg = toast.querySelector('.toast-message');
                                    if (toastMsg) toastMsg.textContent = `Stock máximo: ${item.stock ?? 0} para "${item.nombre}".`;
                                    toast.style.background = '#e74c3c';
                                    toast.classList.add('active');
                                    setTimeout(() => { toast.classList.remove('active'); toast.style.background = ''; }, 2500);
                                }
                                return;
                            }
                        }
                    }
                    carrito[index].cantidad += 1;
                }
                else if (action === 'restar') {
                    carrito[index].cantidad -= 1;
                    if (carrito[index].cantidad <= 0) carrito.splice(index, 1);
                }
                guardarCarrito(carrito);
                renderizarCarrito();
            });
        });
        document.querySelectorAll('.carrito-item-eliminar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                let carrito = obtenerCarrito();
                carrito.splice(index, 1);
                guardarCarrito(carrito);
                renderizarCarrito();
            });
        });
    }

    btnFinalizar.addEventListener('click', () => {
        const carrito = obtenerCarrito();
        if (carrito.length === 0) return;
        if (localStorage.getItem('pendingOrderId')) {
            alert('Ya tenés un pedido pendiente. Esperá a que el pago sea confirmado para realizar otro.');
            return;
        }
        // Auto-fill from user profile data
        const usuario = JSON.parse(localStorage.getItem('usuario'));
        if (usuario && usuario.datosEnvio) {
            const d = usuario.datosEnvio;
            if (d.telefono) checkoutTelefono.value = d.telefono;
            if (d.direccion) checkoutDireccion.value = d.direccion;
        }
        // Also pre-fill nombre and email from user account
        if (usuario) {
            if (usuario.nombre && !checkoutNombre.value) checkoutNombre.value = usuario.nombre;
            if (usuario.email && !checkoutEmail.value) checkoutEmail.value = usuario.email;
        }
        carritoContenido.style.display = 'none';
        carritoCheckout.style.display = 'block';
        checkoutPaso1.style.display = 'block';
        checkoutPaso2.style.display = 'none';
        actualizarResumenEnvio();
    });

    btnVolverCarrito.addEventListener('click', () => {
        carritoCheckout.style.display = 'none';
        carritoContenido.style.display = 'block';
    });

    btnVolverEnvio.addEventListener('click', () => {
        checkoutPaso2.style.display = 'none';
        checkoutPaso1.style.display = 'block';
    });

    checkoutEnvio.addEventListener('change', actualizarResumenEnvio);

    function actualizarResumenEnvio() {
        const carrito = obtenerCarrito();
        const subtotal = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);
        const envioMetodo = checkoutEnvio.value;
        costoEnvio = costosEnvio[envioMetodo] || 0;

        // Retiro en local: auto-fill dirección y deshabilitar campo
        const dirLabel = checkoutDireccion.previousElementSibling;
        if (envioMetodo === 'retiro') {
            checkoutDireccion.value = 'Av. Corrientes 1234, CABA';
            checkoutDireccion.disabled = true;
            checkoutDireccion.style.background = '#f0f0f0';
            checkoutDireccion.style.color = '#666';
            checkoutDireccion.style.cursor = 'not-allowed';
            if (dirLabel) dirLabel.textContent = 'Dirección de retiro';
        } else {
            checkoutDireccion.disabled = false;
            checkoutDireccion.style.background = '';
            checkoutDireccion.style.color = '';
            checkoutDireccion.style.cursor = '';
            if (dirLabel) dirLabel.textContent = 'Dirección';
        }

        // Check first purchase discount
        const usuario = JSON.parse(localStorage.getItem('usuario'));
        descuentoAplicado = 0;
        if (usuario && carrito.length >= 2) {
            const email = usuario.email;
            fetch(`/api/orders/check-first?email=${encodeURIComponent(email)}`)
                .then(r => r.json())
                .then(data => {
                    if (data.esPrimeraCompra) {
                        descuentoAplicado = subtotal * 0.15;
                        resumenDescuentoRow.style.display = 'flex';
                        resumenDescuentoValor.textContent = '-$' + Math.round(descuentoAplicado).toLocaleString('es-AR');
                    } else {
                        resumenDescuentoRow.style.display = 'none';
                    }
                    actualizarTotales(subtotal);
                })
                .catch(() => {
                    actualizarTotales(subtotal);
                });
        } else {
            resumenDescuentoRow.style.display = 'none';
            actualizarTotales(subtotal);
        }

        resumenItemsCount.textContent = carrito.length;
        resumenSubtotal2.textContent = formatearPrecio(subtotal);
        resumenEnvio2.textContent = envioMetodo === 'retiro' ? 'Gratis' : formatearPrecio(costoEnvio);
    }

    function actualizarTotales(subtotal) {
        const total = subtotal + costoEnvio - descuentoAplicado;
        resumenTotal2.textContent = formatearPrecio(total);
    }

    // ─── CREAR ORDEN ───
    formCheckout.addEventListener('submit', async (e) => {
        e.preventDefault();
        btnCrearOrden.disabled = true;
        btnCrearOrden.textContent = 'PROCESANDO...';

        const nombre = checkoutNombre.value.trim();
        const email = checkoutEmail.value.trim();
        const telefono = checkoutTelefono.value.trim();
        const direccion = checkoutDireccion.value.trim();
        const envioMetodo = checkoutEnvio.value;

        // Validar datos reales
        if (nombre.split(/\s+/).length < 2) {
            alert('Ingresá nombre y apellido.');
            btnCrearOrden.disabled = false;
            btnCrearOrden.textContent = 'COMPRAR';
            return;
        }
        if (nombre.length < 5 || !/^[a-zA-ZÀ-ÿ\s]+$/.test(nombre)) {
            alert('Ingresá un nombre válido (solo letras y espacios).');
            btnCrearOrden.disabled = false;
            btnCrearOrden.textContent = 'COMPRAR';
            return;
        }
        if (!/^[\d\s\+\-\(\)]{7,20}$/.test(telefono)) {
            alert('Ingresá un número de teléfono válido (ej: 11 1234-5678).');
            btnCrearOrden.disabled = false;
            btnCrearOrden.textContent = 'COMPRAR';
            return;
        }
        if (envioMetodo !== 'retiro') {
            const letrasDir = (direccion.match(/[a-zA-ZÀ-ÿ]/g) || []).length;
            const numsDir = (direccion.match(/\d/g) || []).length;
            const tienePalabra = /\b[a-zA-ZÀ-ÿ]{4,}\b/.test(direccion);
            const soloLetras = direccion.replace(/[^a-zA-ZÀ-ÿ]/g, '').toLowerCase();
            const vocales = (soloLetras.match(/[aeiouáéíóú]/g) || []);
            const vocalesUnicas = new Set(vocales).size;
            const consSeguidas = soloLetras.match(/[b-df-hj-np-tv-z]{4,}/);
            const cons = soloLetras.replace(/[aeiouáéíóú]/g, '');
            const fila1 = (cons.match(/[qwertyuiop]/g) || []).length;
            const fila2 = (cons.match(/[asdfghjkl]/g) || []).length;
            const fila3 = (cons.match(/[zxcvbnm]/g) || []).length;
            const maxFila = Math.max(fila1, fila2, fila3);
            const tecladoFalso = cons.length > 3 && maxFila / cons.length > 0.9;
            if (letrasDir < 6 || numsDir < 1 || !tienePalabra || vocalesUnicas < 2 || consSeguidas || tecladoFalso) {
                alert('Ingresá una dirección real con calle y número (ej: Av. Corrientes 1234).');
                btnCrearOrden.disabled = false;
                btnCrearOrden.textContent = 'COMPRAR';
                return;
            }
        }

        const carrito = obtenerCarrito();
        const subtotal = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);
        costoEnvio = costosEnvio[envioMetodo] || 0;
        const total = subtotal + costoEnvio - descuentoAplicado;

        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: carrito,
                    subtotal,
                    envio: costoEnvio,
                    total,
                    shipping: labelsEnvio[envioMetodo] || envioMetodo,
                    cliente: { nombre, email, telefono, direccion },
                    email,
                    descuentoAplicado,
                }),
            });
            const data = await res.json();
            if (data.exito) {
                ordenActual = data.orden;
                checkoutOrderInfo.textContent = `Orden #${ordenActual.id} — Total: $${Math.round(total).toLocaleString('es-AR')}`;
                checkoutPaso1.style.display = 'none';
                checkoutPaso2.style.display = 'block';
                document.querySelectorAll('.pago-opcion').forEach(el => {
                    el.querySelector('.pago-detalle').style.display = 'none';
                    el.querySelector('.pago-check').textContent = '○';
                    el.style.borderColor = '#eee';
                });
                // Set payment amounts
                const montoStr = '$' + Math.round(total).toLocaleString('es-AR');
                document.getElementById('pagoMontoTransferencia').textContent = montoStr;
                document.getElementById('pagoMontoTarjeta').textContent = montoStr;
                document.getElementById('pagoMontoMP').textContent = montoStr;
                // No vaciar carrito — queda hasta que el dueño confirme el pago
                localStorage.setItem('pendingOrderId', data.orden.id);
                if (typeof actualizarBadgeCarrito === 'function') actualizarBadgeCarrito();
            } else {
                alert(data.error || 'Error al crear la orden.');
            }
        } catch (err) {
            alert('Error de conexión con el servidor. Asegurate de que el backend esté corriendo.');
        }
        btnCrearOrden.disabled = false;
        btnCrearOrden.textContent = 'COMPRAR';
    });

    // ─── SELECCIÓN DE PAGO ───
    document.querySelectorAll('.pago-opcion').forEach(opcion => {
        const header = opcion.querySelector('div[style*="cursor:pointer"]') || opcion;
        const detalle = opcion.querySelector('.pago-detalle');

        opcion.addEventListener('click', (e) => {
            if (e.target.closest('button') || e.target.closest('input')) return;
            document.querySelectorAll('.pago-opcion').forEach(o => {
                o.querySelector('.pago-detalle').style.display = 'none';
                o.querySelector('.pago-check').textContent = '○';
                o.style.borderColor = '#eee';
            });
            detalle.style.display = 'block';
            opcion.querySelector('.pago-check').textContent = '●';
            opcion.style.borderColor = '#000';
        });
    });

    // ─── PAGO: TRANSFERENCIA ───
    document.getElementById('btnPagoTransferencia').addEventListener('click', async () => {
        if (!ordenActual) return;
        const btn = document.getElementById('btnPagoTransferencia');
        const statusEl = document.getElementById('transferStatus');
        const fileInput = document.getElementById('transferComprobante');
        const referencia = document.getElementById('transferReferencia').value.trim();

        btn.disabled = true;
        btn.textContent = 'ENVIANDO...';

        const formData = new FormData();
        formData.append('referencia', referencia);
        if (fileInput.files[0]) formData.append('comprobante', fileInput.files[0]);

        try {
            const res = await fetch(`/api/orders/${ordenActual.id}/submit-receipt`, {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (data.exito) {
                statusEl.style.display = 'block';
                statusEl.style.background = '#f0f8f0';
                statusEl.style.color = '#27ae60';
                statusEl.style.border = '1px solid #27ae60';
                statusEl.innerHTML = '✅ Comprobante enviado. El dueño verificará el pago y te confirmará por email.';
                btn.style.display = 'none';
                fileInput.style.display = 'none';
                document.getElementById('transferReferencia').style.display = 'none';
            } else {
                statusEl.style.display = 'block';
                statusEl.style.background = '#fff5f5';
                statusEl.style.color = '#e74c3c';
                statusEl.style.border = '1px solid #f5c6c6';
                statusEl.textContent = data.error || 'Error al enviar el comprobante.';
                btn.disabled = false;
                btn.textContent = 'ENVIAR COMPROBANTE';
            }
        } catch {
            statusEl.style.display = 'block';
            statusEl.style.background = '#fff5f5';
            statusEl.style.color = '#e74c3c';
            statusEl.style.border = '1px solid #f5c6c6';
            statusEl.textContent = 'Error de conexión con el servidor.';
            btn.disabled = false;
            btn.textContent = 'ENVIAR COMPROBANTE';
        }
    });

    // ─── PAGO: TARJETA ───
    let mpCardForm = null;

    function initMercadoPago() {
        if (typeof MercadoPago === 'undefined' || mpCardForm) return;
        const mp = new MercadoPago('APP_USR-1159db74-3749-44a7-8415-07ea0ed8f5e1');
        mpCardForm = mp.cardForm({
            amount: '0',
            autoMount: false,
            form: {
                id: 'cardForm',
                token: 'cardToken',
                cardNumber: { id: 'cardNumber', placeholder: '1234 5678 9012 3456' },
                cardExpirationDate: { id: 'cardExpirationDate', placeholder: 'MM/AA' },
                securityCode: { id: 'cardCvv', placeholder: '123' },
                cardholderName: { id: 'cardName', placeholder: 'Como figura en la tarjeta' },
                identificationType: { id: 'cardDocType' },
                identificationNumber: { id: 'cardDocNumber' },
                installments: { id: 'cardInstallments' },
            },
            callbacks: {
                onFormMounted: () => {},
                onSubmit: (e) => { e.preventDefault(); },
                onFetching: () => { document.getElementById('btnPagoTarjeta').textContent = 'PROCESANDO...'; document.getElementById('btnPagoTarjeta').disabled = true; },
                onError: (err) => {
                    const msg = err?.message || err || 'Error al procesar la tarjeta.';
                    document.getElementById('btnPagoTarjeta').disabled = false;
                    document.getElementById('btnPagoTarjeta').textContent = 'PAGAR';
                    alert(msg);
                },
                onToken: async (token) => {
                    if (!ordenActual) return;
                    const btn = document.getElementById('btnPagoTarjeta');
                    const pmId = document.getElementById('cardPaymentMethodId').value;
                    const issuerId = document.getElementById('cardIssuerId').value;
                    const installments = document.getElementById('cardInstallments').value || 1;
                    try {
                        const res = await fetch('/api/process-card-payment', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                token,
                                orderId: ordenActual.id,
                                email: checkoutEmail.value.trim(),
                                installments: parseInt(installments),
                                paymentMethodId: pmId,
                                issuerId: issuerId || undefined,
                            }),
                        });
                        const data = await res.json();
                        if (data.exito) {
                            mostrarExito(ordenActual.id, 'Tarjeta de crédito/débito');
                        } else {
                            alert(data.mensaje || 'El pago fue rechazado.');
                            btn.disabled = false;
                            const monto = document.getElementById('pagoMontoTarjeta').textContent;
                            btn.textContent = 'PAGAR ' + monto;
                        }
                    } catch {
                        alert('Error de conexión con el servidor.');
                        btn.disabled = false;
                        const monto = document.getElementById('pagoMontoTarjeta').textContent;
                        btn.textContent = 'PAGAR ' + monto;
                    }
                },
            },
        });
    }

    document.getElementById('btnPagoTarjeta').addEventListener('click', async () => {
        if (!ordenActual) return;
        const btn = document.getElementById('btnPagoTarjeta');
        btn.disabled = true;

        // Validar campos manualmente
        const number = document.getElementById('cardNumber').value.trim();
        const expiry = document.getElementById('cardExpirationDate').value.trim();
        const cvv = document.getElementById('cardCvv').value.trim();
        const name = document.getElementById('cardName').value.trim();
        const docNum = document.getElementById('cardDocNumber').value.trim();

        if (!number || !expiry || !cvv || !name || !docNum) {
            alert('Completá todos los datos de la tarjeta.');
            btn.disabled = false;
            return;
        }

        if (!mpCardForm) initMercadoPago();
        mpCardForm.submit();
    });

    // ─── PAGO: MERCADO PAGO (Checkout Pro) ───
    document.getElementById('btnPagoMP').addEventListener('click', async () => {
        if (!ordenActual) return;
        const btn = document.getElementById('btnPagoMP');
        btn.disabled = true;
        btn.textContent = 'REDIRIGIENDO...';
        try {
            // Crear preferencia y redirigir
            const res = await fetch('/api/create-preference', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: ordenActual.id,
                    total: ordenActual.total,
                    email: checkoutEmail.value.trim(),
                    items: ordenActual.items,
                }),
            });
            const data = await res.json();
            if (data.exito && data.init_point) {
                guardarCarrito([]);
                localStorage.removeItem('pendingOrderId');
                if (typeof actualizarBadgeCarrito === 'function') actualizarBadgeCarrito();
                window.location.href = data.init_point;
            } else {
                alert('Error al crear el pago. Intentá de nuevo.');
                btn.disabled = false;
                btn.textContent = 'YA PAGUÉ';
            }
        } catch {
            alert('Error de conexión con el servidor.');
            btn.disabled = false;
            btn.textContent = 'YA PAGUÉ';
        }
    });

    // Init Mercado Pago on page load
    setTimeout(initMercadoPago, 500);

    function mostrarExito(ordenId, metodo) {
        carritoCheckout.style.display = 'none';
        carritoExito.style.display = 'block';
        document.getElementById('exitoOrderRef').textContent = `Orden #${ordenId} · Pagado con ${metodo}`;
        localStorage.removeItem('pendingOrderId');
        guardarCarrito([]);
        if (typeof actualizarBadgeCarrito === 'function') actualizarBadgeCarrito();
    }

    // ─── FORMATO AUTOMÁTICO DE TARJETA ───
    document.getElementById('cardNumber').addEventListener('input', function () {
        let val = this.value.replace(/\D/g, '').substring(0, 16);
        this.value = val.replace(/(\d{4})(?=\d)/g, '$1-');
    });
    document.getElementById('cardExpirationDate').addEventListener('input', function () {
        let val = this.value.replace(/\D/g, '').substring(0, 4);
        if (val.length > 2) this.value = val.substring(0, 2) + '/' + val.substring(2);
        else this.value = val;
    });
    document.getElementById('cardCvv').addEventListener('input', function () {
        this.value = this.value.replace(/\D/g, '').substring(0, 4);
    });

    renderizarCarrito();
});