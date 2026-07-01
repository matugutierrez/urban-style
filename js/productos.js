let productos = [];

(function() {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', '/api/productos', false);
    try {
        xhr.send();
        if (xhr.status === 200) {
            productos = JSON.parse(xhr.responseText);
        }
    } catch (e) {
        console.error('Error al cargar productos');
    }
})();
