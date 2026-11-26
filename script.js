
const input = document.getElementById("imagen");
const contenedor = document.getElementById("historias");
const mensaje = document.getElementById("mensaje");
const visor = document.getElementById("visor");
const imagenHistoria = document.getElementById("imagenHistoria");
const progresos = document.getElementById("progresos");

const DURACION = 3000;
const VENCIMIENTO = 24 * 60 * 60 * 1000;

let historias = [];
let actual = 0;
let temporizador;
let inicioToque = 0;

// Cargar las historias guardadas
function cargarHistorias() {
    try {
        historias = JSON.parse(localStorage.getItem("historias")) || [];
        if (!Array.isArray(historias)) historias = [];
    } catch {
        historias = [];
    }

    eliminarVencidas();
}

// Guardar historias
function guardarHistorias() {
    localStorage.setItem("historias", JSON.stringify(historias));
}

// Eliminar historias después de 24 horas
function eliminarVencidas() {
    const ahora = Date.now();
    const cantidad = historias.length;

    historias = historias.filter(historia =>
        ahora - historia.fecha < VENCIMIENTO
    );

    if (cantidad !== historias.length) {
        guardarHistorias();
        mostrarHistorias();

        if (visor.style.display === "flex") {
            cerrarVisor();
        }
    }
}

// Mostrar los círculos de historias
function mostrarHistorias() {
    contenedor.querySelectorAll(".historia").forEach(elemento => {
        elemento.remove();
    });

    historias.forEach((historia, indice) => {
        const imagen = document.createElement("img");

        imagen.src = historia.imagen;
        imagen.className = "historia";
        imagen.alt = "Historia " + (indice + 1);

        imagen.addEventListener("click", () => abrirHistoria(indice));

        contenedor.appendChild(imagen);
    });

    mensaje.style.display = historias.length ? "none" : "block";
}

// Subir una imagen
input.addEventListener("change", function () {
    const archivo = input.files[0];

    if (!archivo) return;

    if (!archivo.type.startsWith("image/")) {
        alert("Selecciona una imagen válida.");
        input.value = "";
        return;
    }

    const lector = new FileReader();

    lector.onload = function () {
        const imagen = new Image();

        imagen.onload = function () {
            // Limitar imagen a 1080 x 1920
            const escala = Math.min(
                1,
                1080 / imagen.width,
                1920 / imagen.height
            );

            const canvas = document.createElement("canvas");
            canvas.width = Math.round(imagen.width * escala);
            canvas.height = Math.round(imagen.height * escala);

            const contexto = canvas.getContext("2d");
            contexto.drawImage(imagen, 0, 0, canvas.width, canvas.height);

            const nuevaHistoria = {
                imagen: canvas.toDataURL("image/jpeg", 0.8),
                fecha: Date.now()
            };

            historias.push(nuevaHistoria);

            try {
                guardarHistorias();
                mostrarHistorias();
            } catch {
                historias.pop();
                alert("No hay suficiente espacio para guardar esta imagen.");
            }

            input.value = "";
        };

        imagen.onerror = function () {
            alert("No se pudo abrir la imagen.");
            input.value = "";
        };

        imagen.src = lector.result;
    };

    lector.readAsDataURL(archivo);
});

// Abrir una historia
function abrirHistoria(indice) {
    eliminarVencidas();

    if (!historias[indice]) return;

    actual = indice;
    visor.style.display = "flex";
    reproducirHistoria();
}

// Mostrar imagen y barras de progreso
function reproducirHistoria() {
    clearTimeout(temporizador);

    if (!historias[actual]) {
        cerrarVisor();
        return;
    }

    imagenHistoria.src = historias[actual].imagen;
    progresos.innerHTML = "";

    historias.forEach((historia, indice) => {
        const barra = document.createElement("div");
        barra.className = "barra";

        const relleno = document.createElement("div");
        relleno.className = "relleno";

        if (indice < actual) {
            relleno.style.width = "100%";
        }

        barra.appendChild(relleno);
        progresos.appendChild(barra);
    });

    const rellenoActual = progresos.children[actual].firstChild;

    // Reiniciar animación
    rellenoActual.style.transition = "none";
    rellenoActual.style.width = "0%";

    void rellenoActual.offsetWidth;

    rellenoActual.style.transition = "width 3s linear";
    rellenoActual.style.width = "100%";

    temporizador = setTimeout(() => {
        siguienteHistoria();
    }, DURACION);
}

// Siguiente historia
function siguienteHistoria() {
    if (actual < historias.length - 1) {
        actual++;
        reproducirHistoria();
    } else {
        cerrarVisor();
    }
}

// Historia anterior
function anteriorHistoria() {
    if (actual > 0) {
        actual--;
        reproducirHistoria();
    } else {
        reproducirHistoria();
    }
}

// Cerrar visor
function cerrarVisor() {
    clearTimeout(temporizador);
    visor.style.display = "none";
}

// Botones
document.getElementById("siguiente").addEventListener("click", siguienteHistoria);
document.getElementById("anterior").addEventListener("click", anteriorHistoria);
document.getElementById("cerrar").addEventListener("click", cerrarVisor);

// Deslizar con el dedo
imagenHistoria.addEventListener("touchstart", function (evento) {
    inicioToque = evento.changedTouches[0].screenX;
}, { passive: true });

imagenHistoria.addEventListener("touchend", function (evento) {
    const finalToque = evento.changedTouches[0].screenX;
    const diferencia = inicioToque - finalToque;

    if (diferencia > 50) {
        siguienteHistoria();
    } else if (diferencia < -50) {
        anteriorHistoria();
    }
}, { passive: true });

// Teclado
document.addEventListener("keydown", function (evento) {
    if (visor.style.display !== "flex") return;

    if (evento.key === "ArrowRight") siguienteHistoria();
    if (evento.key === "ArrowLeft") anteriorHistoria();
    if (evento.key === "Escape") cerrarVisor();
});

// Comprobar vencimiento periódicamente
setInterval(eliminarVencidas, 1000);

// Iniciar aplicación
cargarHistorias();
mostrarHistorias();
