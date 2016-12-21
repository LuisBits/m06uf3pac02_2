// He decidido utilizar este método (IndexedDB) ya que es el que actualmente recomienda HTML5.
// Además he optado por usar un modelo de POO para llevarlo a cabo.
var Funciones = {
    // Estas 2 propiedades se usarán en todas las funciones para la conexión a la BBDD.
    conexion: null,
    baseDatos: null,

    iniciar: function () {
        // Creo una BBDD mediante IndexedDB, compatible con los principales navegadores.
        var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
        // Creo la BBDD 'Colegio', en la versión 1.
        this.conexion = indexedDB.open('Colegio', 1);
        // Capturo los eventos de BBDD preexistentes, confirmaciones y errores sobre la conexión.
        this.conexion.addEventListener(
            'upgradeneeded',
            this.onupgradeneeded.bind(this)
        );
        this.conexion.addEventListener(
            'success',
            this.onsuccess.bind(this)
        );
        this.conexion.addEventListener(
            'error',
            this.onerror.bind(this)
        );
    },
    // Compruebo si la BBDD existe.
    onupgradeneeded: function (evento) {
        this.baseDatos = this.conexion.result;
        // Si la tabla no está creada, la creamos. Primero el keyPath, sería como la Primary Key.
        var tabla = this.baseDatos.createObjectStore('centros', {
            keyPath: 'id',
            autoIncrement: true
        });
        // Y los demás campos se crean tipo índice, por si luego se quiere usar para filtrar y/o que sean campos únicos.
        tabla.createIndex('asignatura', 'asignatura', {unique: false});
        tabla.createIndex('curso', 'curso', {unique: false});
        tabla.createIndex('fecha', 'fecha', {unique: false});

    },
    // Si la conexión es correcta, muestro mensaje y ejecuto listado, según la página en que se encuentre.
    onsuccess: function (evento) {
        console.log("Conexión a BBDD correcta");
        // Si nos encontramos en la página de listar o modificar, mostramos la tabla o fila.
        if (window.location.pathname == '/html/listaCentros.html' || window.location.pathname == '/html/modificarCentros.html') {Funciones.listarCentros();}
        if (window.location.pathname == '/html/actualizarCentros.html') {
            var id = (window.location.search.substr(1)).toString();
            Funciones.mostrarFila(id);
        }
    },
    // Si hay algún error en la conexión, lo mostramos.
    onerror: function (evento) {console.log("Error en BBDD: " + evento.target.errorCode);},

    listarCentros: function () {
        this.baseDatos = this.conexion.result;
        // Realizaremos la petición en una transacción, con permisos de lectura.
        var datos = this.baseDatos.transaction('centros', 'readonly');
        var tabla = datos.objectStore('centros');
        // Array que contendrá los datos de la tabla almacenada.
        var tablaCentros = [];
        // Recorremos la tabla con 'openCursor'
        tabla.openCursor().onsuccess = function (evento) {
            var resultado = evento.target.result;
            // Si la tabla está vacía mostramos mensaje.
            if (resultado === null) {
                document.getElementById("listaCentros").innerHTML =
                    '<tr>\
                        <td colspan="4">No hay Centros.</td>\
                    </tr>';
                return;
            }
            // Introducimos el resultado en el array.
            tablaCentros.push(resultado.value);
            // Y seguimos recorriendo la tabla.
            resultado.continue();
            // Mostramos los resultados.
            datos.oncomplete = function () {
                var HTML = '';
                for (var fila in tablaCentros) {
                    HTML += '\n\
                        <tr>\n\
                            <td>' + tablaCentros[fila].id + '</td>\n\
                            <td>' + tablaCentros[fila].asignatura + '</td>\n\
                            <td>' + tablaCentros[fila].curso + '</td>\n\
                            <td>' + tablaCentros[fila].fecha + '</td>\n';
                    // En la página de Modificar incluyo botones para actualizar o eliminar.
                    if (window.location.pathname == '/html/modificarCentros.html') {
                        HTML += '<td>\n\
                                <a href="actualizarCentros.html?' + tablaCentros[fila].id + '">Modificar</a>\n\
                            </td>\n\
                            <td>\n\
                                <button type="button" onclick="Funciones.eliminarCentro(' + tablaCentros[fila].id + ')">Eliminar</button>\n\
                            </td>\n';
                    }
                    HTML += '</tr>';
                }
                // Vaciamos el array, y imprimimos en pantalla.
                tablaCentros = [];
                document.getElementById("listaCentros").innerHTML = HTML;
            };

        };
    },

    altaCentro: function () {
        this.baseDatos = this.conexion.result;
        // Realizaremos la petición en una transacción, con permisos de escritura.
        var datos = this.baseDatos.transaction('centros', 'readwrite');
        var tabla = datos.objectStore('centros');
        // Capturo la fecha y cambio el formato (de yyyy-mm-dd a dd-mm-yyyy)
        var fecha = document.getElementById("fecha").value;
        var fechaOK = fecha.substr(8, 2) + '-' + fecha.substr(5, 2) + '-' + fecha.substr(0, 4);
        // Ingresamos valores en la tabla.
        var solicitud = tabla.put({
            asignatura: document.getElementById("asignatura").value,
            curso: document.getElementById("curso").value,
            fecha: fechaOK
        });        
        // Si todo es correcto, reseteo valores y mostramos mensaje.
        solicitud.onsuccess = function (evento) {
            document.getElementById("asignatura").value = '';
            document.getElementById("curso").value = '';
            document.getElementById("fecha").value = '';
            alert('Centro agregado correctamente');
        };
    },

    eliminarCentro: function (id) {
        this.baseDatos = this.conexion.result;
        // Eliminamos el centro con id pasado.
        var datos = this.baseDatos.transaction('centros', 'readwrite').objectStore('centros').delete(id);        
        // Si todo es correcto, mostramos mensaje y listo de nuevo.       
        datos.onsuccess = function (evento) {
            alert('Centro eliminado.');
            Funciones.listarCentros();
        };
    },

    actualizarCentro: function (id) {
        this.baseDatos = this.conexion.result;
        // Realizaremos la petición en una transacción, con permisos de escritura.
        var tabla = this.baseDatos.transaction('centros', 'readwrite').objectStore('centros');
        // Seleccionamos la fila con el id indicado.
        var fila = tabla.get(parseInt(id));
        fila.onsuccess = function (evento) {
            // Cogemos los datos guardados.
            var datos = fila.result;
            var asignatura = document.getElementById("asignatura").value;
            var curso = document.getElementById("curso").value;
            // Capturo la fecha y cambio el formato (de yyyy-mm-dd a dd-mm-yyyy).
            var fecha = document.getElementById("fecha").value;
            var fechaOK = fecha.substr(8, 2) + '-' + fecha.substr(5, 2) + '-' + fecha.substr(0, 4);
            // Si hay alguna modificación, se recoge.
            if (asignatura != '') {datos.asignatura = asignatura;}
            if (curso != '') {datos.curso = curso;}
            if (fecha != '') {datos.fecha = fechaOK;}
            // Ingresamos valores en la tabla.
            var actualizar = tabla.put(datos);           
            // Si todo es correcto, reseteo valores y mostramos mensaje.
            actualizar.onsuccess = function (event) {
                alert('Centro actualizado.');
                Funciones.mostrarFila(id);
            };
        };
    },
    // Esta función la utilizo al modificar una entrada, muestra los datos de la fila a actualizar.
    mostrarFila: function (idCentro) {
        this.baseDatos = this.conexion.result;        
        var tabla = this.baseDatos.transaction('centros', 'readwrite').objectStore('centros');
        var fila = tabla.get(parseInt(idCentro));
        fila.onsuccess = function (evento) {            
            var HTML = '';
            HTML += '\n\
                        <tr>\n\
                            <td>' + fila.result.id + '</td>\n\
                            <td>' + fila.result.asignatura + '</td>\n\
                            <td>' + fila.result.curso + '</td>\n\
                            <td>' + fila.result.fecha + '</td>\n\
                        </tr>';
            document.getElementById("listaCentros").innerHTML = HTML;
        };
    },

    // Creo unos ejemplos para pruebas.
    crearEjemplos: function () {
        this.baseDatos = this.conexion.result;
        const EJEMPLOS = [
            {
                asignatura: "Matemáticas",
                curso: "1º ESO",
                fecha: "22-10-2014"
            },
            {
                asignatura: "Lengua",
                curso: "2º ESO",
                fecha: "23-10-2015"
            },
            {
                asignatura: "Física",
                curso: "3º ESO",
                fecha: "24-10-2016"
            },
            {
                asignatura: "Química",
                curso: "4º ESO",
                fecha: "25-10-2017"
            }
        ];
        var ejemplo = this.baseDatos.transaction('centros', 'readwrite').objectStore('centros');

        for (var i in EJEMPLOS) {
            var rellenar = ejemplo.add(EJEMPLOS[i]);
        }
        rellenar.onsuccess = function (evento) {
            alert("Ejemplos añadidos.");            
        };
       
    }

};