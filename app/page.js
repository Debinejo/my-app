"use client";
import React, { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { ref, get } from "firebase/database"; // Importar Firebase Realtime Database
import { database } from "./firebase";

export default function Home() {
  return (
    <main>
      <h1>Bienvenido</h1>
      <p>Para ver tu información, escanea tu código QR</p>
      <QRScanner />
    </main>
  );
}

function QRScanner() {
  const [mensaje, setMensaje] = useState("");
  const [adminIds, setAdminIds] = useState([]);
  const [enfermeraIds, setEnfermeraIds] = useState([]);

  useEffect(() => {
    // Cargar IDs desde Firebase
    const adminRef = ref(database, "admin/id");
    const enfermerasRef = ref(database, "enfermeras");

    get(adminRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          setAdminIds([snapshot.val()]);
          console.log("Admin IDs:", [snapshot.val()]);
        }
      })
      .catch((error) => {
        console.error("Error al cargar admin IDs:", error);
      });

    get(enfermerasRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const ids = Object.keys(snapshot.val());
          setEnfermeraIds(ids);
          console.log("Enfermera IDs:", ids);
        }
      })
      .catch((error) => {
        console.error("Error al cargar enfermera IDs:", error);
      });
  }, []);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", {
      fps: 10,
      qrbox: 250,
    });

    scanner.render(
      (decodedText) => {
        if (adminIds.includes(decodedText)) {
          setMensaje("Clave de administrador correcta. Redirigiendo...");
          setTimeout(() => {
            window.location.href = "/admin"; // Página de administrador
          }, 2000);
        } else if (enfermeraIds.includes(decodedText)) {
          setMensaje("Clave de enfermera correcta. Redirigiendo...");
          setTimeout(() => {
            window.location.href = `/enfermera?id=${decodedText}`; // Página de enfermera con ID
          }, 2000);
        } else {
          setMensaje("Clave inválida. Intenta nuevamente.");
        }
      },
      (error) => {
        console.error("Error escaneando:", error);
      }
    );

    return () => {
      scanner.clear(); // Limpia el escáner al desmontar el componente
    };
  }, [adminIds, enfermeraIds]);

  return (
    <>
      <div id="reader" style={{ width: "100%" }}></div>
      <p>{mensaje}</p>
    </>
  );
}
