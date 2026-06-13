const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || 'http://localhost:' + PORT;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const DB_PATH = path.join(__dirname, 'db', 'users.json');
const ORDERS_PATH = path.join(__dirname, 'db', 'orders.json');

// Mercado Pago client
const mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

// Multer config (for receipt uploads)
const RECEIPTS_PATH = path.join(__dirname, 'receipts');
const upload = multer({ dest: RECEIPTS_PATH }).single('comprobante');

// Multer config (for product image uploads)
const UPLOADS_PATH = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_PATH)) fs.mkdirSync(UPLOADS_PATH, { recursive: true });
const productUpload = multer({ dest: UPLOADS_PATH }).single('productImage');

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_PATH));
app.use(express.static(path.join(__dirname)));

// ─── TRANSPORTE DE GMAIL ───
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// ─── BASE DE DATOS (JSON) ───
function leerUsuarios() {
    try {
        const data = fs.readFileSync(DB_PATH, 'utf-8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

function guardarUsuarios(usuarios) {
    fs.writeFileSync(DB_PATH, JSON.stringify(usuarios, null, 2));
}

// ─── GENERAR CÓDIGO DE VERIFICACIÓN ───
function generarCodigo() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codigo = '';
    for (let i = 0; i < 6; i++) {
        codigo += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return codigo;
}

// ─── MIDDLEWARE: VERIFICAR TOKEN ───
function autenticar(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token requerido' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.usuario = decoded;
        next();
    } catch {
        res.status(401).json({ error: 'Token inválido' });
    }
}

// ─── RUTA: ENVIAR EMAIL DE CONTACTO ───
app.post('/api/contacto', async (req, res) => {
    try {
        const { nombre, email, mensaje } = req.body;

        if (!nombre || !email || !mensaje) {
            return res.status(400).json({ error: 'Completá todos los campos.' });
        }

        // Notificar al dueño del sitio
        await transporter.sendMail({
            from: `"Urban Style Contacto" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            subject: `Nueva consulta de ${nombre}`,
            html: `
                <h2>Nueva consulta desde la web</h2>
                <p><strong>Nombre:</strong> ${nombre}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Mensaje:</strong></p>
                <p>${mensaje}</p>
            `,
        });

        // Email de confirmación para el cliente
        await transporter.sendMail({
            from: `"Urban Style" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Recibimos tu consulta - Urban Style',
            html: `
                <h2>¡Gracias por contactarte, ${nombre}!</h2>
                <p>Recibimos tu consulta y nos pondremos en contacto a la brevedad.</p>
                <p><strong>Tu mensaje:</strong></p>
                <p>${mensaje}</p>
                <br>
                <p>Saludos,<br>Equipo Urban Style</p>
            `,
        });

        res.json({ exito: true, mensaje: 'Mensaje enviado con éxito.' });
    } catch (error) {
        console.error('Error al enviar email:', error);
        res.status(500).json({ error: 'Error al enviar el mensaje.' });
    }
});

// ─── RUTA: REGISTRAR USUARIO ───
app.post('/api/register', async (req, res) => {
    try {
        const { nombre, email, dni, password } = req.body;

        if (!nombre || !email || !dni || !password) {
            return res.status(400).json({ error: 'Completá todos los campos.' });
        }
        if (!/^\d{7,9}$/.test(dni)) {
            return res.status(400).json({ error: 'El DNI debe tener entre 7 y 9 dígitos numéricos.' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
        }

        const adminUser = process.env.ADMIN_USER || 'admin';
        if (email === adminUser) {
            return res.status(400).json({ error: 'Email no disponible para registro.' });
        }

        const usuarios = leerUsuarios();
        if (usuarios.find(u => u.email === email)) {
            return res.status(400).json({ error: 'Ya existe una cuenta con ese email.' });
        }
        if (usuarios.find(u => u.dni === dni)) {
            return res.status(400).json({ error: 'Ya existe una cuenta con ese DNI.' });
        }

        const codigo = generarCodigo();
        const expiracion = Date.now() + 10 * 60 * 1000; // 10 minutos

        const hashedPassword = await bcrypt.hash(password, 10);
        const nuevoUsuario = {
            id: Date.now().toString(),
            nombre,
            email,
            dni,
            password: hashedPassword,
            verified: false,
            codigo,
            expiracion,
            fecha: new Date().toISOString(),
            datosEnvio: {},
        };

        usuarios.push(nuevoUsuario);
        guardarUsuarios(usuarios);

        // Enviar email con código de verificación
        transporter.sendMail({
            from: `"Urban Style" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Tu código de verificación - Urban Style',
            html: `
                <div style="font-family:'Montserrat',Arial,sans-serif;max-width:520px;margin:0 auto;padding:30px;background:#fff;border:1px solid #eee;border-radius:8px;">
                    <div style="text-align:center;font-size:28px;font-weight:900;letter-spacing:4px;margin-bottom:25px;">URBAN</div>
                    <h2 style="text-align:center;font-size:22px;margin-bottom:8px;font-weight:700;">Verificá tu email</h2>
                    <p style="text-align:center;color:#666;font-size:14px;margin-bottom:25px;">Usá este código para activar tu cuenta</p>
                    <div style="background:#000;color:#fff;font-size:36px;font-weight:900;letter-spacing:12px;text-align:center;padding:20px;border-radius:6px;margin:0 auto 25px;max-width:300px;font-family:monospace;">${codigo}</div>
                    <p style="text-align:center;color:#999;font-size:12px;">Este código expira en 10 minutos.</p>
                    <p style="text-align:center;color:#999;font-size:12px;">Si no creaste esta cuenta, ignorá este email.</p>
                    <br>
                    <p style="text-align:center;color:#666;font-size:13px;">Saludos,<br><strong>Equipo Urban Style</strong></p>
                </div>
            `,
        }).catch(err => console.error('Error al enviar email de verificación:', err));

        res.json({
            exito: true,
            necesitaVerificar: true,
            email,
        });
    } catch (error) {
        console.error('Error al registrar:', error);
        res.status(500).json({ error: 'Error al crear la cuenta.' });
    }
});

// ─── RUTA: VERIFICAR CÓDIGO ───
app.post('/api/verificar-codigo', async (req, res) => {
    try {
        const { email, codigo } = req.body;

        if (!email || !codigo) {
            return res.status(400).json({ error: 'Completá todos los campos.' });
        }

        const usuarios = leerUsuarios();
        const usuario = usuarios.find(u => u.email === email);

        if (!usuario) {
            return res.status(400).json({ error: 'Usuario no encontrado.' });
        }

        if (usuario.verified) {
            return res.status(400).json({ error: 'Esta cuenta ya está verificada.' });
        }

        if (usuario.codigo !== codigo) {
            return res.status(400).json({ error: 'Código incorrecto.' });
        }

        if (Date.now() > usuario.expiracion) {
            return res.status(400).json({ error: 'El código expiró. Pedí uno nuevo.' });
        }

        usuario.verified = true;
        delete usuario.codigo;
        delete usuario.expiracion;
        guardarUsuarios(usuarios);

        // Email de bienvenida (no bloquea)
        transporter.sendMail({
            from: `"Urban Style" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '¡Bienvenido a Urban Style!',
            html: `
                <h2>¡Bienvenido a Urban Style, ${usuario.nombre}!</h2>
                <p>Tu cuenta ha sido verificada y creada exitosamente.</p>
                <p>Ya podés iniciar sesión y comenzar a comprar.</p>
                <br>
                <p>Saludos,<br>Equipo Urban Style</p>
            `,
        }).catch(err => console.error('Error al enviar email de bienvenida:', err));

        const token = jwt.sign(
            { id: usuario.id, nombre: usuario.nombre, email: usuario.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            exito: true,
            token,
            usuario: { nombre: usuario.nombre, email: usuario.email, dni: usuario.dni, fecha: usuario.fecha, datosEnvio: usuario.datosEnvio || {} },
        });
    } catch (error) {
        console.error('Error al verificar código:', error);
        res.status(500).json({ error: 'Error al verificar el código.' });
    }
});

// ─── RUTA: REENVIAR CÓDIGO ───
app.post('/api/reenviar-codigo', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email requerido.' });
        }

        const usuarios = leerUsuarios();
        const usuario = usuarios.find(u => u.email === email);

        if (!usuario) {
            return res.status(400).json({ error: 'Usuario no encontrado.' });
        }

        if (usuario.verified) {
            return res.status(400).json({ error: 'Esta cuenta ya está verificada.' });
        }

        const nuevoCodigo = generarCodigo();
        usuario.codigo = nuevoCodigo;
        usuario.expiracion = Date.now() + 10 * 60 * 1000;
        guardarUsuarios(usuarios);

        transporter.sendMail({
            from: `"Urban Style" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Nuevo código de verificación - Urban Style',
            html: `
                <div style="font-family:'Montserrat',Arial,sans-serif;max-width:520px;margin:0 auto;padding:30px;background:#fff;border:1px solid #eee;border-radius:8px;">
                    <div style="text-align:center;font-size:28px;font-weight:900;letter-spacing:4px;margin-bottom:25px;">URBAN</div>
                    <h2 style="text-align:center;font-size:22px;margin-bottom:8px;font-weight:700;">Nuevo código de verificación</h2>
                    <p style="text-align:center;color:#666;font-size:14px;margin-bottom:25px;">Usá este código para activar tu cuenta</p>
                    <div style="background:#000;color:#fff;font-size:36px;font-weight:900;letter-spacing:12px;text-align:center;padding:20px;border-radius:6px;margin:0 auto 25px;max-width:300px;font-family:monospace;">${nuevoCodigo}</div>
                    <p style="text-align:center;color:#999;font-size:12px;">Este código expira en 10 minutos.</p>
                    <br>
                    <p style="text-align:center;color:#666;font-size:13px;">Saludos,<br><strong>Equipo Urban Style</strong></p>
                </div>
            `,
        }).catch(err => console.error('Error al reenviar código:', err));

        res.json({ exito: true, mensaje: 'Código reenviado.' });
    } catch (error) {
        console.error('Error al reenviar código:', error);
        res.status(500).json({ error: 'Error al reenviar el código.' });
    }
});

// ─── RUTA: INICIAR SESIÓN ───
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Completá todos los campos.' });
        }

        // Detectar admin
        const adminUser = process.env.ADMIN_USER || 'admin';
        const adminPass = process.env.ADMIN_PASS || 'admin123';
        if (email === adminUser && password === adminPass) {
            const adminToken = jwt.sign({ role: 'admin', username: adminUser }, JWT_SECRET + '-admin', { expiresIn: '24h' });
            return res.json({
                exito: true,
                esAdmin: true,
                adminToken,
                usuario: { nombre: 'Admin', email: adminUser },
            });
        }

        const usuarios = leerUsuarios();
        const usuario = usuarios.find(u => u.email === email);

        if (!usuario) {
            return res.status(400).json({ error: 'Email o contraseña incorrectos.' });
        }

        const passwordValida = await bcrypt.compare(password, usuario.password);
        if (!passwordValida) {
            return res.status(400).json({ error: 'Email o contraseña incorrectos.' });
        }

        const token = jwt.sign(
            { id: usuario.id, nombre: usuario.nombre, email: usuario.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            exito: true,
            token,
            usuario: { nombre: usuario.nombre, email: usuario.email, dni: usuario.dni, fecha: usuario.fecha, datosEnvio: usuario.datosEnvio || {} },
        });
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ error: 'Error al iniciar sesión.' });
    }
});

// ─── GUARDAR DATOS DE PERFIL ───
app.put('/api/perfil', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ error: 'No autorizado.' });
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        const usuarios = leerUsuarios();
        const usuario = usuarios.find(u => u.id === decoded.id);
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });

        const { telefono, direccion, ciudad, provincia, cp, piso } = req.body;
        usuario.datosEnvio = { telefono, direccion, ciudad, provincia, cp, piso };
        guardarUsuarios(usuarios);
        res.json({ exito: true, datosEnvio: usuario.datosEnvio });
    } catch (error) {
        console.error('Error al guardar perfil:', error);
        res.status(500).json({ error: 'Error al guardar perfil.' });
    }
});

// ─── RECUPERAR EMAIL (por DNI) o CONTRASEÑA (por email) ───
app.post('/api/recuperar-email', async (req, res) => {
    try {
        const { dni, email } = req.body;
        const modo = dni ? 'dni' : email ? 'email' : null;

        if (!modo) {
            return res.status(400).json({ error: 'Completá los campos requeridos.' });
        }

        const usuarios = leerUsuarios();
        let usuario;

        if (modo === 'dni') {
            usuario = usuarios.find(u => u.dni === dni);
            if (!usuario) {
                return res.status(404).json({
                    error: 'No encontramos un usuario con ese DNI.',
                    contactar: true,
                });
            }
        } else {
            if (email === (process.env.ADMIN_USER || 'admin')) {
                return res.status(404).json({
                    error: 'No encontramos una cuenta con ese email.',
                });
            }
            usuario = usuarios.find(u => u.email === email);
            if (!usuario) {
                return res.status(404).json({
                    error: 'No encontramos una cuenta con ese email.',
                });
            }
        }

        const codigo = generarCodigo();
        usuario.codigoRecuperacion = codigo;
        usuario.expiracionRecuperacion = Date.now() + 10 * 60 * 1000;
        guardarUsuarios(usuarios);

        const emailOculto = usuario.email.replace(/(.{2})(.*)(?=@)/, (m, a, b) =>
            a + '*'.repeat(Math.min(b.length, 4)) + (b.length > 4 ? b.slice(-2) : '')
        );

        transporter.sendMail({
            from: `"Urban Style" <${process.env.EMAIL_USER}>`,
            to: usuario.email,
            subject: modo === 'dni' ? 'Recuperación de email - Urban Style' : 'Recuperación de contraseña - Urban Style',
            html: `
                <div style="font-family:'Montserrat',Arial,sans-serif;max-width:520px;margin:0 auto;padding:30px;background:#fff;border:1px solid #eee;border-radius:8px;">
                    <div style="text-align:center;font-size:28px;font-weight:900;letter-spacing:4px;margin-bottom:25px;">URBAN</div>
                    <h2 style="text-align:center;font-size:22px;margin-bottom:8px;font-weight:700;">Recuperación de ${modo === 'dni' ? 'email' : 'contraseña'}</h2>
                    <p style="text-align:center;color:#666;font-size:14px;margin-bottom:8px;">Recibimos una solicitud de recuperación para tu cuenta asociada a:</p>
                    <p style="text-align:center;font-size:18px;font-weight:700;margin-bottom:20px;">${usuario.email}</p>
                    <p style="text-align:center;color:#666;font-size:14px;margin-bottom:25px;">Usá este código para continuar:</p>
                    <div style="background:#000;color:#fff;font-size:36px;font-weight:900;letter-spacing:12px;text-align:center;padding:20px;border-radius:6px;margin:0 auto 25px;max-width:300px;font-family:monospace;">${codigo}</div>
                    <p style="text-align:center;color:#999;font-size:12px;">Este código expira en 10 minutos.</p>
                    <p style="text-align:center;color:#999;font-size:12px;">Si no solicitaste esto, ignorá este email.</p>
                    <br>
                    <p style="text-align:center;color:#666;font-size:13px;">Saludos,<br><strong>Equipo Urban Style</strong></p>
                </div>
            `,
        }).catch(err => console.error('Error al enviar código de recuperación:', err));

        res.json({
            exito: true,
            mensaje: 'Código enviado al email asociado.',
            emailMostrar: emailOculto,
            modo,
        });
    } catch (error) {
        console.error('Error al recuperar:', error);
        res.status(500).json({ error: 'Error al procesar la solicitud.' });
    }
});

// ─── VERIFICAR CÓDIGO Y CAMBIAR CONTRASEÑA ───
app.post('/api/verificar-recuperacion', async (req, res) => {
    try {
        const { identificador, tipo, codigo, nuevaPassword } = req.body;

        if (!identificador || !tipo || !codigo) {
            return res.status(400).json({ error: 'Completá todos los campos.' });
        }

        const usuarios = leerUsuarios();
        let usuario;

        if (tipo === 'dni') {
            usuario = usuarios.find(u => u.dni === identificador);
        } else {
            usuario = usuarios.find(u => u.email === identificador);
        }

        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        if (!usuario.codigoRecuperacion || usuario.codigoRecuperacion !== codigo) {
            return res.status(400).json({ error: 'Código incorrecto.' });
        }

        if (Date.now() > usuario.expiracionRecuperacion) {
            return res.status(400).json({ error: 'El código expiró. Solicitá uno nuevo.' });
        }

        // Step 1: just verify the code (no password yet)
        if (!nuevaPassword) {
            return res.json({
                exito: true,
                paso: 'codigo-verificado',
                mensaje: 'Código verificado correctamente.',
                email: usuario.email,
            });
        }

        // Step 2: verify AND change password
        if (nuevaPassword.length < 6) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
        }

        const hashedPassword = await bcrypt.hash(nuevaPassword, 10);
        usuario.password = hashedPassword;
        delete usuario.codigoRecuperacion;
        delete usuario.expiracionRecuperacion;
        guardarUsuarios(usuarios);

        res.json({
            exito: true,
            paso: 'password-cambiada',
            mensaje: 'Contraseña actualizada correctamente.',
            email: usuario.email,
        });
    } catch (error) {
        console.error('Error al verificar recuperación:', error);
        res.status(500).json({ error: 'Error al procesar la solicitud.' });
    }
});

// ─── CONTACTAR CUANDO NO SE RECUERDA EL DNI ───
app.post('/api/contactar-dni', async (req, res) => {
    try {
        const { emailAlternativo, mensaje } = req.body;

        if (!emailAlternativo) {
            return res.status(400).json({ error: 'Ingresá un email de contacto.' });
        }

        const textoUsuario = mensaje || 'El usuario no recuerda su DNI asociado a la cuenta.';

        await transporter.sendMail({
            from: `"Urban Style Web" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            subject: 'Alguien no recuerda su DNI - Urban Style',
            html: `
                <h2>Problema de recuperación de cuenta</h2>
                <p>Un usuario no recuerda su DNI asociado a la cuenta.</p>
                <p><strong>Email de contacto del usuario:</strong> ${emailAlternativo}</p>
                <p><strong>Mensaje:</strong> ${textoUsuario}</p>
                <p>Por favor contactarlo para ayudarlo a recuperar su cuenta.</p>
            `,
        });

        await transporter.sendMail({
            from: `"Urban Style" <${process.env.EMAIL_USER}>`,
            to: emailAlternativo,
            subject: 'Recibimos tu consulta - Urban Style',
            html: `
                <div style="font-family:'Montserrat',Arial,sans-serif;max-width:520px;margin:0 auto;padding:30px;background:#fff;border:1px solid #eee;border-radius:8px;">
                    <div style="text-align:center;font-size:28px;font-weight:900;letter-spacing:4px;margin-bottom:25px;">URBAN</div>
                    <h2 style="text-align:center;font-size:20px;margin-bottom:12px;font-weight:700;">Recibimos tu consulta</h2>
                    <p style="text-align:center;color:#666;font-size:14px;line-height:1.6;">Nos vamos a poner en contacto con vos a la brevedad para ayudarte a recuperar tu cuenta.</p>
                    <p style="text-align:center;color:#666;font-size:14px;line-height:1.6;">Guardamos tu email <strong>${emailAlternativo}</strong> para contactarte.</p>
                    <br>
                    <p style="text-align:center;color:#666;font-size:13px;">Saludos,<br><strong>Equipo Urban Style</strong></p>
                </div>
            `,
        });

        res.json({ exito: true, mensaje: 'Te contactaremos a la brevedad.' });
    } catch (error) {
        console.error('Error al contactar:', error);
        res.status(500).json({ error: 'Error al enviar el mensaje.' });
    }
});

// ─── SOLICITAR ELIMINACIÓN DE CUENTA (envía código) ───
app.post('/api/solicitar-eliminacion', autenticar, async (req, res) => {
    try {
        const usuarios = leerUsuarios();
        const usuario = usuarios.find(u => u.id === req.usuario.id);

        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        const codigo = generarCodigo();
        usuario.codigoEliminacion = codigo;
        usuario.expiracionEliminacion = Date.now() + 10 * 60 * 1000;
        guardarUsuarios(usuarios);

        transporter.sendMail({
            from: `"Urban Style" <${process.env.EMAIL_USER}>`,
            to: usuario.email,
            subject: 'Código para eliminar tu cuenta - Urban Style',
            html: `
                <div style="font-family:'Montserrat',Arial,sans-serif;max-width:520px;margin:0 auto;padding:30px;background:#fff;border:1px solid #eee;border-radius:8px;">
                    <div style="text-align:center;font-size:28px;font-weight:900;letter-spacing:4px;margin-bottom:25px;">URBAN</div>
                    <h2 style="text-align:center;font-size:22px;margin-bottom:8px;font-weight:700;">Eliminación de cuenta</h2>
                    <p style="text-align:center;color:#666;font-size:14px;margin-bottom:25px;">Usá este código para confirmar la eliminación de tu cuenta</p>
                    <div style="background:#c0392b;color:#fff;font-size:36px;font-weight:900;letter-spacing:12px;text-align:center;padding:20px;border-radius:6px;margin:0 auto 25px;max-width:300px;font-family:monospace;">${codigo}</div>
                    <p style="text-align:center;color:#999;font-size:12px;">Este código expira en 10 minutos.</p>
                    <p style="text-align:center;color:#999;font-size:12px;">Si no solicitaste esta acción, ignorá este email.</p>
                    <br>
                    <p style="text-align:center;color:#666;font-size:13px;">Saludos,<br><strong>Equipo Urban Style</strong></p>
                </div>
            `,
        }).catch(err => console.error('Error al enviar código de eliminación:', err));

        res.json({ exito: true, mensaje: 'Código enviado a tu email.' });
    } catch (error) {
        console.error('Error al solicitar eliminación:', error);
        res.status(500).json({ error: 'Error al solicitar la eliminación.' });
    }
});

// ─── VERIFICAR CÓDIGO Y ELIMINAR CUENTA ───
app.post('/api/verificar-eliminacion', autenticar, async (req, res) => {
    try {
        const { codigo } = req.body;

        if (!codigo) {
            return res.status(400).json({ error: 'Código requerido.' });
        }

        const usuarios = leerUsuarios();
        const usuario = usuarios.find(u => u.id === req.usuario.id);

        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        if (!usuario.codigoEliminacion || usuario.codigoEliminacion !== codigo) {
            return res.status(400).json({ error: 'Código incorrecto.' });
        }

        if (Date.now() > usuario.expiracionEliminacion) {
            return res.status(400).json({ error: 'El código expiró. Solicitá uno nuevo.' });
        }

        const index = usuarios.findIndex(u => u.id === req.usuario.id);
        const nombre = usuario.nombre;
        usuarios.splice(index, 1);
        guardarUsuarios(usuarios);

        res.json({ exito: true, nombre, mensaje: 'Cuenta eliminada permanentemente.' });
    } catch (error) {
        console.error('Error al verificar eliminación:', error);
        res.status(500).json({ error: 'Error al eliminar la cuenta.' });
    }
});

// ─── RUTA: VERIFICAR TOKEN (para mantener sesión) ───
app.get('/api/verificar', autenticar, (req, res) => {
    res.json({ valido: true, usuario: req.usuario });
});

// ─── ÓRDENES ───
function leerOrdenes() {
    try {
        const data = fs.readFileSync(ORDERS_PATH, 'utf-8');
        return JSON.parse(data);
    } catch { return []; }
}
function guardarOrdenes(ordenes) {
    fs.writeFileSync(ORDERS_PATH, JSON.stringify(ordenes, null, 2));
}
function generarIdOrden() {
    return 'URB-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
}

// Enviar email con template de Urban
function enviarEmailHTML(to, subject, html) {
    return transporter.sendMail({
        from: `"Urban Style" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html: `
        <div style="font-family:'Montserrat',Arial,sans-serif;max-width:560px;margin:0 auto;padding:30px;background:#fff;border:1px solid #eee;border-radius:8px;">
            <div style="text-align:center;font-size:28px;font-weight:900;letter-spacing:6px;margin-bottom:25px;color:#000;">URBAN</div>
            ${html}
            <br>
            <p style="text-align:center;color:#999;font-size:12px;border-top:1px solid #eee;padding-top:16px;">© 2026 Urban Style — Todos los derechos reservados</p>
        </div>`,
    });
}

// ─── RUTA: VERIFICAR SI ES PRIMERA COMPRA ───
app.get('/api/orders/check-first', (req, res) => {
    const email = req.query.email;
    if (!email) return res.json({ esPrimeraCompra: false });
    const ordenes = leerOrdenes();
    const ordenesUsuario = ordenes.filter(o => o.email === email);
    res.json({ esPrimeraCompra: ordenesUsuario.length === 0 });
});

// ─── RUTA: CREAR ORDEN ───
app.post('/api/orders', async (req, res) => {
    try {
        const { items, subtotal, envio, total, shipping, cliente, email, descuentoAplicado } = req.body;

        if (!items || !items.length || !cliente || !email) {
            return res.status(400).json({ error: 'Completá todos los campos obligatorios.' });
        }

        // Validar stock disponible
        const productosStock = leerProductos();
        for (const item of items) {
            const prod = productosStock.find(p => p.id === item.id || p.nombre === item.nombre);
            if (!prod) {
                return res.status(400).json({ error: `Producto "${item.nombre}" no encontrado.` });
            }
            if ((prod.stock || 0) < item.cantidad) {
                return res.status(400).json({ error: `Stock insuficiente para "${item.nombre}". Disponible: ${prod.stock}, solicitado: ${item.cantidad}.` });
            }
        }

        const ordenId = generarIdOrden();
        const usuarios = leerUsuarios();
        const usuario = usuarios.find(u => u.email === email);
        const ordenesUsuario = leerOrdenes().filter(o => o.email === email);
        const esPrimeraCompra = ordenesUsuario.length === 0;
        const tieneDosProductos = items.length >= 2;

        // Aplicar descuento si corresponde
        let descuento = 0;
        let descuentoMsg = '';
        if (esPrimeraCompra && tieneDosProductos) {
            descuento = subtotal * 0.15;
            descuentoMsg = '15% primera compra (2+ productos)';
        }

        const orden = {
            id: ordenId,
            fecha: new Date().toISOString(),
            email,
            cliente,
            items,
            subtotal,
            envio,
            descuento,
            descuentoMsg,
            total: total - descuento,
            shipping,
            metodoPago: null,
            estado: 'pendiente',
            pagoVerificado: false,
            userId: usuario ? usuario.id : null,
        };

        const ordenes = leerOrdenes();
        ordenes.push(orden);
        guardarOrdenes(ordenes);

        // Dirección según método de envío
        const dirEnvio = shipping === 'Retiro en local'
            ? 'Av. Corrientes 1234, CABA'
            : cliente.direccion;

        const itemsHTML = items.map(i => `
            <tr>
                <td style="padding:10px;border-bottom:1px solid #eee;font-size:14px;">${i.nombre}</td>
                <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;font-size:14px;">x${i.cantidad}</td>
                <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;font-size:14px;font-weight:600;">$${(i.precio * i.cantidad).toLocaleString('es-AR')}</td>
            </tr>
        `).join('');

        // Email de confirmación de orden al comprador
        await enviarEmailHTML(email, `Orden #${ordenId} recibida - Urban Style`, `
            <h2 style="text-align:center;font-size:20px;font-weight:700;margin-bottom:6px;">¡Gracias por tu compra!</h2>
            <p style="text-align:center;color:#666;font-size:14px;margin-bottom:20px;">Tu orden <strong>#${ordenId}</strong> fue registrada con éxito.</p>
            <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
                <thead><tr>
                    <th style="text-align:left;padding:10px;border-bottom:2px solid #000;font-size:13px;">Producto</th>
                    <th style="text-align:center;padding:10px;border-bottom:2px solid #000;font-size:13px;">Cant.</th>
                    <th style="text-align:right;padding:10px;border-bottom:2px solid #000;font-size:13px;">Subtotal</th>
                </tr></thead>
                <tbody>${itemsHTML}</tbody>
            </table>
            <div style="border-top:2px solid #000;padding-top:12px;margin-bottom:20px;">
                ${descuento > 0 ? `<p style="display:flex;justify-content:space-between;font-size:14px;color:#e74c3c;margin:4px 0;"><span>Descuento (${descuentoMsg}):</span><span>-$${Math.round(descuento).toLocaleString('es-AR')}</span></p>` : ''}
                <p style="display:flex;justify-content:space-between;font-size:14px;margin:4px 0;"><span>Envío (${shipping}):</span><span>${envio > 0 ? '$' + envio.toLocaleString('es-AR') : 'Gratis'}</span></p>
                <p style="display:flex;justify-content:space-between;font-size:18px;font-weight:900;margin:8px 0 0;"><span>Total:</span><span>$${Math.round(total - descuento).toLocaleString('es-AR')}</span></p>
            </div>
            <div style="background:#f9f9f9;padding:16px;border-radius:6px;font-size:13px;color:#555;line-height:1.6;">
                <strong style="display:block;margin-bottom:4px;color:#000;">${shipping === 'Retiro en local' ? 'Retiro en local' : 'Datos de envío'}</strong>
                ${cliente.nombre}<br>
                ${dirEnvio}<br>
                ${shipping === 'Retiro en local' ? 'Te esperamos de lunes a viernes de 10 a 19hs.' : shipping}
            </div>
            <p style="text-align:center;color:#666;font-size:13px;margin-top:20px;">Te vamos a enviar otro email cuando confirmemos el pago.</p>
        `);

        // Notificar al dueño de la tienda
        const itemsResumen = items.map(i => `• ${i.nombre} x${i.cantidad} = $${(i.precio * i.cantidad).toLocaleString('es-AR')}`).join('<br>');
        transporter.sendMail({
            from: `"Urban Style Web" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            subject: `🛒 Nueva orden #${ordenId} - ${cliente.nombre}`,
            html: `
                <h2>Nueva orden recibida</h2>
                <p><strong>Orden:</strong> #${ordenId}</p>
                <p><strong>Cliente:</strong> ${cliente.nombre}</p>
                <p><strong>Email:</strong> ${cliente.email}</p>
                <p><strong>Teléfono:</strong> ${cliente.telefono || '-'}</p>
                <p><strong>Dirección:</strong> ${dirEnvio}</p>
                <p><strong>Envío:</strong> ${shipping}</p>
                <p><strong>Total:</strong> $${Math.round(total - descuento).toLocaleString('es-AR')}</p>
                <p><strong>Productos:</strong></p>
                <p>${itemsResumen}</p>
                ${descuento > 0 ? `<p><strong>Descuento aplicado:</strong> ${descuentoMsg} (-$${Math.round(descuento).toLocaleString('es-AR')})</p>` : ''}
                <p style="color:#999;font-size:12px;margin-top:16px;">Esperando pago del cliente.</p>
            `,
        }).catch(err => console.error('Error al notificar al dueño:', err));

        res.json({
            exito: true,
            orden: orden,
            esPrimeraCompra,
            tieneDosProductos,
            descuentoAplicado: descuento > 0,
            descuento,
            descuentoMsg,
        });
    } catch (error) {
        console.error('Error al crear orden:', error);
        res.status(500).json({ error: 'Error al procesar la orden.' });
    }
});

// ─── RUTA: LISTAR ÓRDENES POR EMAIL ───
app.get('/api/orders', (req, res) => {
    const email = req.query.email;
    if (!email) return res.status(400).json({ error: 'Email requerido.' });
    const ordenes = leerOrdenes().filter(o => o.email === email).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    res.json(ordenes);
});

// ─── RUTA: VER ORDEN ───
app.get('/api/orders/:id', (req, res) => {
    const ordenes = leerOrdenes();
    const orden = ordenes.find(o => o.id === req.params.id);
    if (!orden) return res.status(404).json({ error: 'Orden no encontrada.' });
    res.json(orden);
});

// ─── RUTA: VERIFICAR PAGO ───
app.post('/api/orders/:id/pay', async (req, res) => {
    try {
        const { metodoPago, email } = req.body;
        const ordenes = leerOrdenes();
        const orden = ordenes.find(o => o.id === req.params.id);

        if (!orden) return res.status(404).json({ error: 'Orden no encontrada.' });
        if (orden.pagoVerificado) return res.status(400).json({ error: 'Esta orden ya fue pagada.' });

        orden.metodoPago = metodoPago;
        orden.estado = 'pagado';
        orden.pagoVerificado = true;
        orden.fechaPago = new Date().toISOString();
        guardarOrdenes(ordenes);

        // Descontar stock
        descontarStock(orden.items);

        // Email de confirmación de pago
        const itemsHTML = orden.items.map(i => `
            <tr>
                <td style="padding:10px;border-bottom:1px solid #eee;font-size:14px;">${i.nombre}</td>
                <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;font-size:14px;">x${i.cantidad}</td>
                <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;font-size:14px;font-weight:600;">$${(i.precio * i.cantidad).toLocaleString('es-AR')}</td>
            </tr>
        `).join('');

        const metodoLabel = metodoPago === 'transferencia' ? 'Transferencia bancaria' :
                            metodoPago === 'tarjeta' ? 'Tarjeta de crédito/débito' : 'Mercado Pago';

        await enviarEmailHTML(email, `✅ Pago confirmado - Orden #${orden.id}`, `
            <div style="text-align:center;font-size:48px;margin-bottom:12px;">✅</div>
            <h2 style="text-align:center;font-size:20px;font-weight:700;margin-bottom:6px;">¡Pago confirmado!</h2>
            <p style="text-align:center;color:#666;font-size:14px;margin-bottom:20px;">El pago de tu orden <strong>#${orden.id}</strong> fue verificado.</p>
            <div style="background:#f0f8f0;border:1px solid #27ae60;padding:14px;border-radius:6px;margin-bottom:20px;text-align:center;">
                <p style="font-size:13px;color:#555;margin-bottom:4px;">Método de pago</p>
                <p style="font-size:16px;font-weight:700;color:#27ae60;">${metodoLabel}</p>
            </div>
            <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
                <thead><tr>
                    <th style="text-align:left;padding:10px;border-bottom:2px solid #000;font-size:13px;">Producto</th>
                    <th style="text-align:center;padding:10px;border-bottom:2px solid #000;font-size:13px;">Cant.</th>
                    <th style="text-align:right;padding:10px;border-bottom:2px solid #000;font-size:13px;">Subtotal</th>
                </tr></thead>
                <tbody>${itemsHTML}</tbody>
            </table>
            <p style="display:flex;justify-content:space-between;font-size:18px;font-weight:900;border-top:2px solid #000;padding-top:12px;">
                <span>Total pagado:</span>
                <span>$${Math.round(orden.total).toLocaleString('es-AR')}</span>
            </p>
            <div style="background:#f9f9f9;padding:16px;border-radius:6px;margin-top:16px;font-size:13px;color:#555;line-height:1.6;">
                <strong style="display:block;margin-bottom:4px;color:#000;">Envío</strong>
                ${orden.shipping}<br>
                ${orden.cliente.direccion}
            </div>
            <p style="text-align:center;color:#666;font-size:13px;margin-top:20px;">Tu pedido está siendo procesado para envío.</p>
        `);

        res.json({ exito: true, orden });
    } catch (error) {
        console.error('Error al verificar pago:', error);
        res.status(500).json({ error: 'Error al verificar el pago.' });
    }
});

// ─── RUTA: ENVIAR COMPROBANTE DE TRANSFERENCIA ───
app.post('/api/orders/:id/submit-receipt', (req, res) => {
    upload(req, res, async (err) => {
        try {
            if (err) return res.status(400).json({ error: 'Error al subir el archivo.' });

            const ordenes = leerOrdenes();
            const orden = ordenes.find(o => o.id === req.params.id);
            if (!orden) return res.status(404).json({ error: 'Orden no encontrada.' });
            if (orden.pagoVerificado) return res.status(400).json({ error: 'Esta orden ya fue pagada.' });

            const referencia = req.body.referencia || '';
            const archivo = req.file;

            // Marcar como pendiente de verificación
            orden.estado = 'pending_verification';
            orden.metodoPago = 'transferencia';
            orden.referenciaTransferencia = referencia;
            orden.comprobantePath = archivo ? archivo.filename : null;
            guardarOrdenes(ordenes);

            // Email al comprador: aviso que recibimos el comprobante
            await enviarEmailHTML(orden.email, `Comprobante recibido - Orden #${orden.id}`, `
                <h2 style="text-align:center;font-size:20px;font-weight:700;margin-bottom:6px;">Recibimos tu comprobante</h2>
                <p style="text-align:center;color:#666;font-size:14px;margin-bottom:20px;">Estamos verificando el pago de tu orden <strong>#${orden.id}</strong>.</p>
                <p style="text-align:center;color:#666;font-size:14px;">Te vamos a confirmar por email cuando esté aprobado.</p>
            `);

            // Email al dueño con el comprobante adjunto
            const attachments = archivo ? [{
                filename: archivo.originalname,
                path: archivo.path,
            }] : [];

            await transporter.sendMail({
                from: `"Urban Style Web" <${process.env.EMAIL_USER}>`,
                to: process.env.EMAIL_USER,
                subject: `💳 Comprobante recibido - Orden #${orden.id} - ${orden.cliente.nombre}`,
                html: `
                    <h2>Comprobante de transferencia recibido</h2>
                    <p><strong>Orden:</strong> #${orden.id}</p>
                    <p><strong>Cliente:</strong> ${orden.cliente.nombre}</p>
                    <p><strong>Email:</strong> ${orden.cliente.email}</p>
                    <p><strong>Teléfono:</strong> ${orden.cliente.telefono || '-'}</p>
                    <p><strong>Referencia:</strong> ${referencia || '(sin referencia)'}</p>
                    <p><strong>Total:</strong> $${Math.round(orden.total).toLocaleString('es-AR')}</p>
                    <p><strong>Envío:</strong> ${orden.shipping}</p>
                    ${archivo ? `<p><strong>Comprobante:</strong> adjunto en este email</p>` : '<p><strong>Comprobante:</strong> no se adjuntó archivo</p>'}
                    <br>
                    <p>Para confirmar el pago, hacé clic en el siguiente enlace:</p>
                    <p><a href="${BASE_URL}/api/orders/${orden.id}/confirm-payment" style="display:inline-block;background:#27ae60;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:700;">✓ CONFIRMAR PAGO</a></p>
                    <p style="color:#999;font-size:12px;margin-top:12px;">O usá el endpoint: POST /api/orders/${orden.id}/confirm-payment</p>
                `,
                attachments,
            });

            res.json({ exito: true, mensaje: 'Comprobante enviado. Esperá la confirmación del pago.' });
        } catch (error) {
            console.error('Error al procesar comprobante:', error);
            res.status(500).json({ error: 'Error al procesar el comprobante.' });
        }
    });
});

// ─── RUTA: CONFIRMAR PAGO (dueño) ───
async function confirmarPago(req, res) {
    try {
        const ordenes = leerOrdenes();
        const orden = ordenes.find(o => o.id === req.params.id);
        if (!orden) return res.status(404).json({ error: 'Orden no encontrada.' });
        if (orden.pagoVerificado) return res.status(400).json({ error: 'Esta orden ya fue pagada.' });

        orden.estado = 'pagado';
        orden.pagoVerificado = true;
        orden.fechaPago = new Date().toISOString();
        guardarOrdenes(ordenes);

        descontarStock(orden.items);

        const itemsHTML = orden.items.map(i => `
            <tr>
                <td style="padding:10px;border-bottom:1px solid #eee;font-size:14px;">${i.nombre}</td>
                <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;font-size:14px;">x${i.cantidad}</td>
                <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;font-size:14px;font-weight:600;">$${(i.precio * i.cantidad).toLocaleString('es-AR')}</td>
            </tr>
        `).join('');

        const metodoLabel = orden.metodoPago === 'transferencia' ? 'Transferencia bancaria' :
                            orden.metodoPago === 'tarjeta' ? 'Tarjeta de crédito/débito' : 'Mercado Pago';

        await enviarEmailHTML(orden.email, `✅ Pago confirmado - Orden #${orden.id}`, `
            <div style="text-align:center;font-size:48px;margin-bottom:12px;">✅</div>
            <h2 style="text-align:center;font-size:20px;font-weight:700;margin-bottom:6px;">¡Pago confirmado!</h2>
            <p style="text-align:center;color:#666;font-size:14px;margin-bottom:20px;">El pago de tu orden <strong>#${orden.id}</strong> fue verificado por nuestro equipo.</p>
            <div style="background:#f0f8f0;border:1px solid #27ae60;padding:14px;border-radius:6px;margin-bottom:20px;text-align:center;">
                <p style="font-size:13px;color:#555;margin-bottom:4px;">Método de pago</p>
                <p style="font-size:16px;font-weight:700;color:#27ae60;">${metodoLabel}</p>
            </div>
            <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">${itemsHTML}</table>
            <p style="display:flex;justify-content:space-between;font-size:18px;font-weight:900;border-top:2px solid #000;padding-top:12px;">
                <span>Total pagado:</span><span>$${Math.round(orden.total).toLocaleString('es-AR')}</span>
            </p>
            <div style="background:#f9f9f9;padding:16px;border-radius:6px;margin-top:16px;font-size:13px;color:#555;line-height:1.6;">
                <strong style="display:block;margin-bottom:4px;color:#000;">Envío</strong>
                ${orden.shipping}<br>${orden.cliente.direccion || 'Retiro en local'}
            </div>
        `);

        transporter.sendMail({
            from: `"Urban Style Web" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            subject: `✅ Pago confirmado - Orden #${orden.id} - ${orden.cliente.nombre}`,
            html: `<h2>Pago confirmado manualmente</h2><p><strong>Orden:</strong> #${orden.id}</p><p><strong>Cliente:</strong> ${orden.cliente.nombre}</p><p><strong>Método:</strong> ${metodoLabel}</p><p><strong>Total:</strong> $${Math.round(orden.total).toLocaleString('es-AR')}</p><p><strong>Envío:</strong> ${orden.shipping}</p><p style="color:#27ae60;font-weight:700;">✅ Pago verificado</p>`,
        }).catch(err => console.error('Error al notificar al dueño:', err));

        if (req.method === 'GET') {
            return res.send(`<html><head><meta charset="utf-8"><title>Pago confirmado</title><style>body{font-family:Montserrat,Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f5f5f5;}.card{background:white;padding:40px;border-radius:12px;text-align:center;box-shadow:0 2px 20px rgba(0,0,0,0.06);max-width:400px;}h1{font-size:28px;margin-bottom:8px;}p{color:#666;font-size:14px;}</style></head><body><div class="card"><div style="font-size:64px;margin-bottom:16px;">✅</div><h1>Pago confirmado</h1><p>El pago de la orden <strong>#${orden.id}</strong> fue verificado exitosamente.</p><p style="color:#27ae60;font-weight:700;">${metodoLabel}</p></div></body></html>`);
        }

        res.json({ exito: true, orden });
    } catch (error) {
        console.error('Error al confirmar pago:', error);
        res.status(500).json({ error: 'Error al confirmar el pago.' });
    }
}
app.post('/api/orders/:id/confirm-payment', (req, res) => confirmarPago(req, res));
app.get('/api/orders/:id/confirm-payment', (req, res) => confirmarPago(req, res));

// ─── MERCADO PAGO: CREAR PREFERENCIA (Checkout Pro) ───
app.post('/api/create-preference', async (req, res) => {
    try {
        const { orderId, total, email, items } = req.body;
        const descripcion = items ? items.map(i => `${i.nombre} x${i.cantidad}`).join(', ') : `Orden #${orderId}`;

        const preference = await new Preference(mpClient).create({
            body: {
                items: [{
                    title: `Urban Style - Orden #${orderId}`,
                    description: descripcion,
                    quantity: 1,
                    currency_id: 'ARS',
                    unit_price: Math.round(total),
                }],
                payer: { email: email || '' },
                back_urls: {
                    success: `${req.headers.origin || BASE_URL}/carrito.html?status=success&order=${orderId}`,
                    failure: `${req.headers.origin || BASE_URL}/carrito.html?status=failure&order=${orderId}`,
                    pending: `${req.headers.origin || BASE_URL}/carrito.html?status=pending&order=${orderId}`,
                },
                auto_return: 'approved',
                external_reference: orderId,
                notification_url: `${BASE_URL.replace('http://', 'https://')}/api/webhook/mercadopago`,
            },
        });

        res.json({
            exito: true,
            init_point: preference.init_point,
            preference_id: preference.id,
        });
    } catch (error) {
        console.error('Error al crear preferencia MP:', error);
        res.status(500).json({ exito: false, error: 'Error al crear la preferencia de pago.' });
    }
});

// ─── MERCADO PAGO: PROCESAR PAGO CON TARJETA (API Transparente) ───
app.post('/api/process-card-payment', async (req, res) => {
    try {
        const { token, orderId, email, installments, paymentMethodId, issuerId } = req.body;
        const ordenes = leerOrdenes();
        const orden = ordenes.find(o => o.id === orderId);

        if (!orden) return res.status(404).json({ error: 'Orden no encontrada.' });
        if (orden.pagoVerificado) return res.status(400).json({ error: 'Esta orden ya fue pagada.' });

        const payment = await new Payment(mpClient).create({
            body: {
                transaction_amount: Math.round(orden.total),
                token,
                description: `Urban Style - Orden #${orderId}`,
                installments: installments || 1,
                payment_method_id: paymentMethodId,
                issuer_id: issuerId,
                payer: { email },
            },
        });

        if (payment.status === 'approved') {
            orden.metodoPago = 'tarjeta';
            orden.estado = 'pagado';
            orden.pagoVerificado = true;
            orden.fechaPago = new Date().toISOString();
            orden.mpPaymentId = payment.id;
            guardarOrdenes(ordenes);
            descontarStock(orden.items);

            // Email de confirmación
            const itemsHTML = orden.items.map(i => `
                <tr>
                    <td style="padding:10px;border-bottom:1px solid #eee;font-size:14px;">${i.nombre}</td>
                    <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;font-size:14px;">x${i.cantidad}</td>
                    <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;font-size:14px;font-weight:600;">$${(i.precio * i.cantidad).toLocaleString('es-AR')}</td>
                </tr>
            `).join('');

            await enviarEmailHTML(email, `✅ Pago confirmado - Orden #${orden.id}`, `
                <div style="text-align:center;font-size:48px;margin-bottom:12px;">✅</div>
                <h2 style="text-align:center;font-size:20px;font-weight:700;margin-bottom:6px;">¡Pago con tarjeta confirmado!</h2>
                <p style="text-align:center;color:#666;font-size:14px;margin-bottom:20px;">El pago de tu orden <strong>#${orden.id}</strong> fue procesado con éxito.</p>
                <div style="background:#f0f8f0;border:1px solid #27ae60;padding:14px;border-radius:6px;margin-bottom:20px;text-align:center;">
                    <p style="font-size:13px;color:#555;margin-bottom:4px;">ID de transacción MP</p>
                    <p style="font-size:16px;font-weight:700;color:#27ae60;">${payment.id}</p>
                </div>
                <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
                    <thead><tr>
                        <th style="text-align:left;padding:10px;border-bottom:2px solid #000;font-size:13px;">Producto</th>
                        <th style="text-align:center;padding:10px;border-bottom:2px solid #000;font-size:13px;">Cant.</th>
                        <th style="text-align:right;padding:10px;border-bottom:2px solid #000;font-size:13px;">Subtotal</th>
                    </tr></thead>
                    <tbody>${itemsHTML}</tbody>
                </table>
                <p style="display:flex;justify-content:space-between;font-size:18px;font-weight:900;border-top:2px solid #000;padding-top:12px;">
                    <span>Total pagado:</span>
                    <span>$${Math.round(orden.total).toLocaleString('es-AR')}</span>
                </p>
                <p style="text-align:center;color:#666;font-size:13px;margin-top:20px;">Tu pedido está siendo procesado para envío.</p>
            `);

            res.json({ exito: true, payment, orden });
        } else {
            res.json({
                exito: false,
                status: payment.status,
                detail: payment.status_detail,
                mensaje: 'El pago fue rechazado. Intentá con otro medio de pago.',
            });
        }
    } catch (error) {
        console.error('Error al procesar pago con tarjeta:', error);
        res.status(500).json({ exito: false, error: 'Error al procesar el pago.' });
    }
});

// ─── MERCADO PAGO: WEBHOOK (IPN) ───
app.post('/api/webhook/mercadopago', async (req, res) => {
    try {
        const { type, data } = req.body;
        if (type === 'payment' && data?.id) {
            const payment = await new Payment(mpClient).get({ id: data.id });
            if (payment.status === 'approved') {
                const ordenes = leerOrdenes();
                const orden = ordenes.find(o => o.id === payment.external_reference);
                if (orden && !orden.pagoVerificado) {
                    orden.metodoPago = 'mercadopago';
                    orden.estado = 'pagado';
                    orden.pagoVerificado = true;
                    orden.fechaPago = new Date().toISOString();
                    orden.mpPaymentId = payment.id;
                    guardarOrdenes(ordenes);
                    descontarStock(orden.items);
                }
            }
        }
        res.send('OK');
    } catch (error) {
        console.error('Error en webhook MP:', error);
        res.send('OK');
    }
});

// ─── PRODUCTOS ───
const PRODUCTOS_PATH = path.join(__dirname, 'db', 'productos.json');

function leerProductos() {
    try {
        const data = fs.readFileSync(PRODUCTOS_PATH, 'utf-8');
        return JSON.parse(data);
    } catch { return []; }
}

function guardarProductos(productos) {
    fs.writeFileSync(PRODUCTOS_PATH, JSON.stringify(productos, null, 2));
}

// GET /api/productos — devuelve solo productos activos con stock > 0
app.get('/api/productos', (req, res) => {
    const todos = leerProductos();
    const activos = todos.filter(p => p.activo !== false);
    res.json(activos);
});

// ─── ADMIN: LOGIN ───
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    const adminUser = process.env.ADMIN_USER || 'admin';
    const adminPass = process.env.ADMIN_PASS || 'admin123';
    if (username === adminUser && password === adminPass) {
        const token = jwt.sign({ role: 'admin', username }, JWT_SECRET + '-admin', { expiresIn: '24h' });
        return res.json({ exito: true, token });
    }
    res.status(401).json({ error: 'Credenciales incorrectas.' });
});

// ─── ADMIN: 2FA (código de 6 dígitos) ───
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
let admin2FACode = null;
let admin2FAExpiry = null;

app.post('/api/admin/send-code', authAdmin, (req, res) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    admin2FACode = code;
    admin2FAExpiry = Date.now() + 5 * 60 * 1000; // 5 minutos

    transporter.sendMail({
        from: `"Urban Style Admin" <${process.env.EMAIL_USER}>`,
        to: ADMIN_EMAIL,
        subject: '🔐 Código de verificación - Admin Urban Style',
        html: `
            <div style="font-family:'Montserrat',Arial,sans-serif;max-width:520px;margin:0 auto;padding:30px;background:#fff;border:1px solid #eee;border-radius:8px;">
                <div style="text-align:center;font-size:28px;font-weight:900;letter-spacing:4px;margin-bottom:25px;">URBAN</div>
                <h2 style="text-align:center;font-size:22px;margin-bottom:8px;font-weight:700;">Código de verificación</h2>
                <p style="text-align:center;color:#666;font-size:14px;margin-bottom:8px;">Ingresá este código en el panel admin:</p>
                <div style="background:#000;color:#fff;font-size:42px;font-weight:900;letter-spacing:14px;text-align:center;padding:20px;border-radius:6px;margin:0 auto 25px;max-width:300px;font-family:monospace;">${code}</div>
                <p style="text-align:center;color:#999;font-size:12px;">Este código expira en 5 minutos.</p>
                <p style="text-align:center;color:#999;font-size:12px;">Si no solicitaste este código, ignorá este email.</p>
            </div>
        `,
    }).catch(err => console.error('Error al enviar código 2FA:', err));

    res.json({ exito: true, mensaje: 'Código enviado al email del administrador.' });
});

app.post('/api/admin/verify-code', authAdmin, (req, res) => {
    const { code } = req.body;
    if (!code || code.length !== 6) {
        return res.status(400).json({ error: 'Código inválido.' });
    }
    if (!admin2FACode || !admin2FAExpiry) {
        return res.status(400).json({ error: 'No hay un código activo. Solicitá uno nuevo.' });
    }
    if (Date.now() > admin2FAExpiry) {
        admin2FACode = null;
        admin2FAExpiry = null;
        return res.status(400).json({ error: 'El código expiró. Solicitá uno nuevo.' });
    }
    if (code !== admin2FACode) {
        return res.status(400).json({ error: 'Código incorrecto.' });
    }

    // Código válido: limpiar y devolver verified
    admin2FACode = null;
    admin2FAExpiry = null;
    res.json({ exito: true, verified: true });
});

// Middleware: verificar token de admin
function authAdmin(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token requerido.' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET + '-admin');
        req.admin = decoded;
        next();
    } catch {
        res.status(401).json({ error: 'Token inválido.' });
    }
}

// ─── ADMIN: SUBIR IMAGEN DE PRODUCTO ───

app.post('/api/admin/upload-image', authAdmin, (req, res) => {
    productUpload(req, res, (err) => {
        if (err) return res.status(500).json({ error: 'Error al subir imagen.' });
        if (!req.file) return res.status(400).json({ error: 'No se seleccionó ningún archivo.' });
        const url = `${BASE_URL}/uploads/${req.file.filename}`;
        res.json({ exito: true, url });
    });
});

// ─── ADMIN: CRUD DE PRODUCTOS ───

// Listar todos (incluyendo inactivos)
app.get('/api/admin/productos', authAdmin, (req, res) => {
    res.json(leerProductos());
});

// Crear producto
app.post('/api/admin/productos', authAdmin, (req, res) => {
    try {
        const { nombre, precio, categoria, subcategoria, imagen, descripcion, talles, stock } = req.body;
        if (!nombre || !precio || !categoria) {
            return res.status(400).json({ error: 'Nombre, precio y categoría son obligatorios.' });
        }
        const tallesArr = talles || ['S', 'M', 'L', 'XL', 'XXL'];
        const porTalle = 10;
        const stockPorTalle = {};
        tallesArr.forEach(t => { stockPorTalle[t] = porTalle; });
        const productos = leerProductos();
        const nuevo = {
            id: Date.now().toString(36) + Math.random().toString(36).substring(2, 4),
            nombre,
            precio: Number(precio),
            categoria,
            subcategoria: subcategoria || '',
            imagen: imagen || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600',
            descripcion: descripcion || '',
            talles: tallesArr,
            stock: porTalle * tallesArr.length,
            stockPorTalle,
            activo: true,
        };
        productos.push(nuevo);
        guardarProductos(productos);
        res.json({ exito: true, producto: nuevo });
    } catch (error) {
        console.error('Error al crear producto:', error);
        res.status(500).json({ error: 'Error al crear producto.' });
    }
});

// Editar producto
app.put('/api/admin/productos/:id', authAdmin, (req, res) => {
    try {
        const productos = leerProductos();
        const idx = productos.findIndex(p => p.id === req.params.id);
        if (idx === -1) return res.status(404).json({ error: 'Producto no encontrado.' });

        const { nombre, precio, categoria, subcategoria, imagen, descripcion, talles, stock, activo, stockPorTalle } = req.body;
        if (nombre !== undefined) productos[idx].nombre = nombre;
        if (precio !== undefined) productos[idx].precio = Number(precio);
        if (categoria !== undefined) productos[idx].categoria = categoria;
        if (subcategoria !== undefined) productos[idx].subcategoria = subcategoria;
        if (imagen !== undefined) productos[idx].imagen = imagen;
        if (descripcion !== undefined) productos[idx].descripcion = descripcion;
        if (talles !== undefined) productos[idx].talles = talles;
        if (stock !== undefined) productos[idx].stock = Number(stock);
        if (activo !== undefined) productos[idx].activo = activo;
        if (stockPorTalle !== undefined) {
            productos[idx].stockPorTalle = stockPorTalle;
            // Recalcular stock total
            const vals = Object.values(stockPorTalle);
            productos[idx].stock = vals.reduce((a, b) => a + b, 0);
        }

        guardarProductos(productos);
        res.json({ exito: true, producto: productos[idx] });
    } catch (error) {
        console.error('Error al editar producto:', error);
        res.status(500).json({ error: 'Error al editar producto.' });
    }
});

// Eliminar producto
app.delete('/api/admin/productos/:id', authAdmin, (req, res) => {
    try {
        const productos = leerProductos();
        const idx = productos.findIndex(p => p.id === req.params.id);
        if (idx === -1) return res.status(404).json({ error: 'Producto no encontrado.' });
        productos.splice(idx, 1);
        guardarProductos(productos);
        res.json({ exito: true });
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        res.status(500).json({ error: 'Error al eliminar producto.' });
    }
});

// Helper para descontar stock
function descontarStock(items) {
    const productos = leerProductos();
    items.forEach(item => {
        const prod = productos.find(p => p.id === item.id || p.nombre === item.nombre);
        if (prod) {
            prod.stock = Math.max(0, (prod.stock || 0) - item.cantidad);
            if (prod.stock < 0) prod.stock = 0;
        }
    });
    guardarProductos(productos);
}

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📧 Emails desde: ${process.env.EMAIL_USER}`);
});
