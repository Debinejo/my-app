"use client";
import React, { useState, useEffect } from "react";
import { database } from "../firebase";
import { ref, set, update, get } from "firebase/database";
import { v4 as uuidv4 } from "uuid";
import { QRCodeCanvas } from "qrcode.react";
import { Html5QrcodeScanner } from "html5-qrcode";

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
    </div>
  );
}
