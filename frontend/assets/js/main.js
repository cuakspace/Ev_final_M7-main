const API_URL = 'http://localhost:3501/paises';

const paisesTableBody = document.getElementById('paisesTableBody');
const paginationInfo = document.getElementById('paginationInfo');
const nextButton = document.getElementById('nextButton');
const limitSelect = document.getElementById('limitSelect');
const alertContainer = document.getElementById('alert-container');
const addForm = document.getElementById('addForm');
const deleteForm = document.getElementById('deleteForm');

let currentPage = 1;
let currentLimit = 5;
let totalPages = 1;
let isLoading = false;

const mostrarMensaje = (mensaje, tipo = 'success') => {
  alertContainer.innerHTML = `
    <div class="alert alert-${tipo}" role="alert">
      ${mensaje}
    </div>
  `;
};

const limpiarMensaje = () => {
  alertContainer.innerHTML = '';
};

const setLoadingState = (valor) => {
  isLoading = valor;
  nextButton.disabled = valor || currentPage >= totalPages;
  limitSelect.disabled = valor;
  addForm.querySelector('button[type="submit"]').disabled = valor;
  deleteForm.querySelector('button[type="submit"]').disabled = valor;
};

const manejarError = (error) => {
  const noHayConexion = error instanceof TypeError && error.message === 'Failed to fetch';
  const tiempoAgotado = error.name === 'AbortError';
  const mensaje = noHayConexion
    ? 'No se pudo conectar con el servidor. Inicia el backend en el puerto 3501.'
    : tiempoAgotado
      ? 'El servidor tardó demasiado en responder. Inténtalo nuevamente.'
    : error.message || 'Ocurrió un error en la solicitud.';
  mostrarMensaje(mensaje, 'danger');
};

const realizarSolicitud = async (url, opciones = {}) => {
  const controlador = new AbortController();
  const temporizador = window.setTimeout(() => controlador.abort(), 10000);

  try {
    return await fetch(url, { ...opciones, signal: controlador.signal });
  } finally {
    window.clearTimeout(temporizador);
  }
};

const leerRespuesta = async (response) => {
  const texto = await response.text();
  try {
    return texto ? JSON.parse(texto) : {};
  } catch {
    throw new Error('El servidor devolvió una respuesta inválida.');
  }
};

const construirUrl = () => `${API_URL}?page=${currentPage}&limit=${currentLimit}`;

const actualizarPaginacion = () => {
  paginationInfo.textContent = isLoading ? 'Cargando...' : `Página ${currentPage} de ${totalPages}`;
  nextButton.disabled = currentPage >= totalPages || isLoading;
  limitSelect.disabled = isLoading;
};

const renderizarTabla = (paises) => {
  if (paises.length === 0) {
    paisesTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center">No hay países para mostrar.</td>
      </tr>
    `;
    return;
  }

  const formateador = new Intl.NumberFormat('es-CL');
  paisesTableBody.innerHTML = paises
    .map(
      (pais) => `
        <tr>
          <td>${pais.nombre}</td>
          <td>${pais.continente}</td>
          <td>${pais.poblacion !== null ? formateador.format(pais.poblacion) : '-'}</td>
          <td>${pais.pib_2019 !== null ? formateador.format(pais.pib_2019) : '-'}</td>
          <td>${pais.pib_2020 !== null ? formateador.format(pais.pib_2020) : '-'}</td>
        </tr>
      `
    )
    .join('');
};

const cargarPaises = async () => {
  try {
    limpiarMensaje();
    setLoadingState(true);
    const response = await realizarSolicitud(construirUrl());
    const data = await leerRespuesta(response);

    if (!response.ok) {
      throw new Error(data.message || 'No se pudo cargar la lista de países.');
    }

    totalPages = data.pagination.totalPages;
    renderizarTabla(data.data);
    actualizarPaginacion();
  } catch (error) {
    manejarError(error);
  } finally {
    setLoadingState(false);
    actualizarPaginacion();
  }
};

const agregarPais = async (event) => {
  event.preventDefault();

  const nombre = document.getElementById('nombreInput').value.trim();
  const continente = document.getElementById('continenteInput').value.trim();
  const poblacion = Number(document.getElementById('poblacionInput').value);
  const pib_2019 = Number(document.getElementById('pib2019Input').value);
  const pib_2020 = Number(document.getElementById('pib2020Input').value);

  try {
    setLoadingState(true);

    const response = await realizarSolicitud(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nombre, continente, poblacion, pib_2019, pib_2020 }),
    });

    const data = await leerRespuesta(response);

    if (!response.ok) {
      throw new Error(data.message || 'No se pudo agregar el país.');
    }

    addForm.reset();
    currentPage = 1;
    await cargarPaises();
    mostrarMensaje(data.message || 'País agregado correctamente', 'success');
  } catch (error) {
    manejarError(error);
  } finally {
    setLoadingState(false);
  }
};

const eliminarPais = async (event) => {
  event.preventDefault();

  const nombre = document.getElementById('deleteNombreInput').value.trim();
  if (!nombre) {
    mostrarMensaje('Ingresa el nombre del país a eliminar.', 'warning');
    return;
  }

  const confirmacion = window.confirm(`¿Eliminar el país ${nombre}?`);
  if (!confirmacion) {
    return;
  }

  try {
    isLoading = true;
    actualizarPaginacion();

    const response = await realizarSolicitud(`${API_URL}/${encodeURIComponent(nombre)}`, {
      method: 'DELETE',
    });

    const data = await leerRespuesta(response);

    if (!response.ok) {
      throw new Error(data.message || 'No se pudo eliminar el país.');
    }

    deleteForm.reset();
    currentPage = 1;
    await cargarPaises();
    mostrarMensaje(data.message || 'País eliminado correctamente', 'success');
  } catch (error) {
    manejarError(error);
  } finally {
    setLoadingState(false);
  }
};

limitSelect.addEventListener('change', () => {
  currentLimit = Number(limitSelect.value);
  currentPage = 1;
  cargarPaises();
});

nextButton.addEventListener('click', () => {
  if (currentPage < totalPages) {
    currentPage += 1;
    cargarPaises();
  }
});

addForm.addEventListener('submit', agregarPais);
deleteForm.addEventListener('submit', eliminarPais);

cargarPaises();
