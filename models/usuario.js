// models/usuario.js

const usuarios = [];

function crearUsuario(usuario) {
  usuarios.push(usuario);
  return usuario;
}

function obtenerUsuarios() {
  return usuarios;
}

function obtenerUsuarioPorId(id) {
  return usuarios.find(u => u.id === id);
}

function actualizarUsuario(id, nuevosDatos) {
  const index = usuarios.findIndex(u => u.id === id);
  if (index !== -1) {
    usuarios[index] = { ...usuarios[index], ...nuevosDatos };
    return usuarios[index];
  }
  return null;
}

function eliminarUsuario(id) {
  const index = usuarios.findIndex(u => u.id === id);
  if (index !== -1) {
    return usuarios.splice(index, 1)[0];
  }
  return null;
}

module.exports = {
  crearUsuario,
  obtenerUsuarios,
  obtenerUsuarioPorId,
  actualizarUsuario,
  eliminarUsuario
};
