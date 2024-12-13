"use client";
import React, { useState, useEffect } from "react";
import { database } from "../firebase";
import { ref, set, update, get, remove, onValue } from "firebase/database";
import { v4 as uuidv4 } from "uuid";
import { QRCodeCanvas } from "qrcode.react";
import { Html5QrcodeScanner } from "html5-qrcode";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function AdminPanel() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [idGenerada, setIdGenerada] = useState("");
  const [horario, setHorario] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [mensajeEscaneo, setMensajeEscaneo] = useState("");

  const registrarEnfermera = () => {
    if (!nombre || !email || !telefono || !horario ) {
      alert("Por favor, completa todos los campos.");
      return;
    }

    const id = uuidv4(); // Generar ID única
    setIdGenerada(id);

    const nuevaEnfermera = {
      nombre,
      email,
      telefono,
      horario,
      asistencias: {}, // Asistencias vacías inicialmente
    };

    // Guardar enfermera en Firebase
    set(ref(database, `enfermeras/${id}`), nuevaEnfermera)
      .then(() => {
        alert("Enfermera registrada exitosamente");
        setNombre("");
        setEmail("");
        setTelefono("");
        setHorario("");
      })
      .catch((error) => {
        console.error("Error registrando enfermera:", error);
        alert("Hubo un error al registrar la enfermera.");
      });
  };

  const registrarAsistencia = (idEnfermera) => {
    const fechaHoy = new Date().toISOString().split("T")[0]; // Obtener fecha actual
    const rutaEnfermera = ref(database, `enfermeras/${idEnfermera}/asistencias/${fechaHoy}`);

    // Actualizar la asistencia en Firebase
    set(rutaEnfermera, "presente")
      .then(() => {
        alert(`Asistencia registrada para la enfermera con ID: ${idEnfermera}`);
      })
      .catch((error) => {
        console.error("Error registrando asistencia:", error);
        alert("Hubo un error al registrar la asistencia.");
      });
  };

  const escanearQR = () => {
    const scanner = new Html5QrcodeScanner("reader", {
      fps: 10,
      qrbox: 250,
    });

    scanner.render(
      (decodedText) => {
        // Verificar si el ID existe en Firebase
        get(ref(database, `enfermeras/${decodedText}`))
          .then((snapshot) => {
            if (snapshot.exists()) {
              registrarAsistencia(decodedText);
              setMensajeEscaneo("Asistencia registrada correctamente.");
            } else {
              setMensajeEscaneo("ID de enfermera no encontrado.");
            }
          })
          .catch((error) => {
            console.error("Error verificando el ID:", error);
            setMensajeEscaneo("Error al verificar el ID.");
          });

        scanner.clear(); // Detener el escáner
      },
      (error) => {
        console.error("Error escaneando:", error);
        setMensajeEscaneo("Error escaneando el QR.");
      }
    );

    return () => {
      scanner.clear(); // Limpia el escáner al desmontar el componente
    };
  };

  const descargarQR = () => {
    const canvas = document.getElementById("qr-code");
    const qrImage = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = qrImage;
    link.download = `${idGenerada}_QR.png`;
    link.click();
  };

  return (
    <div>
      <h1>Panel de Administración</h1>

      {/* Sección para registrar enfermeras */}
      <h2>Registrar Enfermera</h2>
      <form>
        <div>
          <label>Nombre:</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label>Teléfono:</label>
          <input
            type="text"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
          />
        </div>
        <div>
          <label>horario:</label>
          <input
            type="text"
            value={horario}
            onChange={(e) => setHorario(e.target.value)}
          />
        </div>
        <button type="button" onClick={registrarEnfermera}>
          Registrar Enfermera
        </button>
      </form>

      {/* Mostrar QR generado */}
      {idGenerada && (
        <div>
          <h3>QR Generado</h3>
          <QRCodeCanvas
            id="qr-code"
            value={idGenerada}
            size={256}
            level={"H"}
            includeMargin={true}
          />
          <button onClick={descargarQR}>Descargar QR</button>
        </div>
      )}
      

      {/* Sección para escanear QR */}
      <h2>Registrar Asistencia</h2>
      <button onClick={escanearQR}>Escanear QR</button>
      <div id="reader" style={{ width: "100%" }}></div>
      {mensajeEscaneo && <p>{mensajeEscaneo}</p>}

      <GenerarPDF/>

      <EnfermerasList/>

      <EditarEnfermeras/>

    </div>
  );
}

const EnfermerasList = () => {
  const [enfermeras, setEnfermeras] = useState([]);

  useEffect(() => {
    const dbRef = ref(database, "enfermeras");

    const unsubscribe = onValue(
      dbRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const lista = Object.entries(data).map(([id, info]) => ({
            id,
            ...info, // Desestructura todos los campos de la enfermera
          }));
          setEnfermeras(lista);
        } else {
          setEnfermeras([]); // Si no hay datos, limpia la lista
        }
      },
      (error) => {
        console.error("Error listening to database:", error);
      }
    );

    // Limpieza del listener cuando el componente se desmonta
    return () => unsubscribe();
  }, []);

  return (
    <div>
      <h1>Lista de Enfermeras</h1>
      {enfermeras.length > 0 ? (
        <ul>
          {enfermeras.map((enfermera) => (
            <li key={enfermera.id}>
              <p><strong>Nombre:</strong> {enfermera.nombre}</p>
              <p><strong>Email:</strong> {enfermera.email}</p>
              <p><strong>Teléfono:</strong> {enfermera.telefono}</p>
              <p><strong>Horario:</strong> {enfermera.horario}</p>
              <p><strong>Asistencias:</strong></p>
              {enfermera.asistencias ? (
                <ul>
                  {Object.entries(enfermera.asistencias).map(
                    ([fecha, estado]) => (
                      <li key={fecha}>
                        {fecha}: {estado}
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <p>No hay asistencias registradas</p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>No hay enfermeras registradas.</p>
      )}
    </div>
  );
};

const EditarEnfermeras = () => {
  const [enfermeras, setEnfermeras] = useState([]);
  const [selectedEnfermera, setSelectedEnfermera] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    horario: "",
  });

  // Cargar datos en tiempo real desde Firebase
  useEffect(() => {
    const dbRef = ref(database, "enfermeras");

    const unsubscribe = onValue(
      dbRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const lista = Object.entries(data).map(([id, info]) => ({
            id,
            ...info,
          }));
          setEnfermeras(lista);
        } else {
          setEnfermeras([]);
        }
      },
      (error) => {
        console.error("Error listening to database:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  // Manejar selección de enfermera
  const handleEditClick = (enfermera) => {
    setSelectedEnfermera(enfermera.id);
    setFormData({
      nombre: enfermera.nombre,
      email: enfermera.email,
      telefono: enfermera.telefono,
      horario: enfermera.horario,
    });
  };

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Guardar los cambios en Firebase
  const handleSave = async () => {
    if (!selectedEnfermera) return;

    const dbRef = ref(database, `enfermeras/${selectedEnfermera}`);
    try {
      await update(dbRef, formData);
      alert("Datos actualizados correctamente");

      // Limpiar el formulario y la selección
      setSelectedEnfermera(null);
      setFormData({
        nombre: "",
        email: "",
        telefono: "",
        horario: "",
      });
    } catch (error) {
      console.error("Error al actualizar los datos:", error);
      alert("Hubo un error al guardar los cambios");
    }
  };

  // Manejar eliminación de enfermera
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "¿Estás seguro de que deseas eliminar este registro?"
    );
    if (!confirmDelete) return;

    const dbRef = ref(database, `enfermeras/${id}`);
    try {
      await remove(dbRef);
      alert("Enfermera eliminada correctamente");
    } catch (error) {
      console.error("Error al eliminar el registro:", error);
      alert("Hubo un error al eliminar la enfermera");
    }
  };

  return (
    <div>
      <h1>Editar Enfermeras</h1>

      {/* Lista de enfermeras */}
      <ul>
        {enfermeras.map((enfermera) => (
          <li key={enfermera.id}>
            <p>
              <strong>Nombre:</strong> {enfermera.nombre}
            </p>
            <p>
              <strong>Email:</strong> {enfermera.email}
            </p>
            <p>
              <strong>Teléfono:</strong> {enfermera.telefono}
            </p>
            <p>
              <strong>Horario:</strong> {enfermera.horario}
            </p>
            <button onClick={() => handleEditClick(enfermera)}>Editar</button>
            <button
              onClick={() => handleDelete(enfermera.id)}
              style={{ marginLeft: "10px", backgroundColor: "red", color: "white" }}
            >
              Borrar
            </button>
          </li>
        ))}
      </ul>

      {/* Formulario de edición */}
      {selectedEnfermera && (
        <div style={{ marginTop: "20px" }}>
          <h2>Editar Datos</h2>
          <form>
            <label>
              Nombre:
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
              />
            </label>
            <br />
            <label>
              Email:
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </label>
            <br />
            <label>
              Teléfono:
              <input
                type="text"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
              />
            </label>
            <br />
            <label>
              Horario:
              <input
                type="text"
                name="horario"
                value={formData.horario}
                onChange={handleChange}
              />
            </label>
            <br />
            <button type="button" onClick={handleSave}>
              Guardar Cambios
            </button>
            <button
              type="button"
              onClick={() => setSelectedEnfermera(null)}
              style={{ marginLeft: "10px" }}
            >
              Cancelar
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

const GenerarPDF = () => {
  const [enfermeras, setEnfermeras] = useState([]);

  // Obtener datos de Firebase en tiempo real
  useEffect(() => {
    const dbRef = ref(database, "enfermeras");

    const unsubscribe = onValue(
      dbRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const lista = Object.entries(data).map(([id, info]) => ({
            id,
            ...info,
          }));
          setEnfermeras(lista);
        } else {
          setEnfermeras([]);
        }
      },
      (error) => {
        console.error("Error fetching data:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  // Generar el PDF
  const handleGeneratePDF = () => {
    const doc = new jsPDF();
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString("default", { month: "long" });
    const currentYear = currentDate.getFullYear();

    // Título del PDF
    doc.setFontSize(16);
    doc.text(`Asistencia de Enfermeras - ${currentMonth} ${currentYear}`, 10, 10);

    // Construir datos de la tabla
    const tableData = enfermeras.map((enfermera) => {
      const asistencias = enfermera.asistencias || {};
      const fechas = Object.entries(asistencias)
        .filter(([fecha]) => fecha.startsWith(`${currentYear}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`))
        .map(([fecha, estado]) => `${fecha}: ${estado}`)
        .join(", ");

      return [
        enfermera.nombre,
        enfermera.email,
        enfermera.telefono,
        enfermera.horario,
        fechas || "No hay asistencias registradas",
      ];
    });

    // Agregar tabla al PDF
    doc.autoTable({
      head: [["Nombre", "Email", "Teléfono", "Horario", "Asistencias"]],
      body: tableData,
    });

    // Guardar el PDF
    doc.save(`asistencia_enfermeras_${currentMonth}_${currentYear}.pdf`);
  };

  return (
    <div>
      <h1>Generar PDF de Asistencia</h1>
      <p>
        Este documento contendrá la asistencia de todas las enfermeras durante el mes
        actual.
      </p>
      <button onClick={handleGeneratePDF}>Generar PDF</button>
    </div>
  );
};
