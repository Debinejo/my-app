"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ref, get } from "firebase/database"; // Importa Firebase Realtime Database
import { database } from "../firebase";

function EnfermeraContent() {
  const searchParams = useSearchParams();
  const enfermeraId = searchParams.get("id"); // Obtener la ID de la URL
  const [enfermeraData, setEnfermeraData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (enfermeraId) {
      const enfermeraRef = ref(database, `enfermeras/${enfermeraId}`);
      get(enfermeraRef)
        .then((snapshot) => {
          if (snapshot.exists()) {
            setEnfermeraData(snapshot.val());
          } else {
            console.error("Enfermera no encontrada.");
          }
        })
        .catch((error) => {
          console.error("Error al obtener datos de la enfermera:", error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [enfermeraId]);

  if (loading) {
    return <p>Cargando...</p>;
  }

  if (!enfermeraData) {
    return <p>Enfermera no encontrada o ID inválida.</p>;
  }

  return (
    <main>
      <h1>Bienvenida, {enfermeraData.nombre}</h1>
      <p><strong>Email:</strong> {enfermeraData.email}</p>
      <p><strong>Teléfono:</strong> {enfermeraData.telefono}</p>
      <p><strong>Horario:</strong> {enfermeraData.horario}</p>
      <h2>Asistencias:</h2>
      <ul>
        {enfermeraData.asistencias
          ? Object.entries(enfermeraData.asistencias).map(([fecha, estado]) => (
              <li key={fecha}>
                {fecha}: {estado}
              </li>
            ))
          : <li>No hay registros de asistencia.</li>}
      </ul>
    </main>
  );
}

export default function Enfermera() {
  return (
    <Suspense fallback={<div>Cargando los datos...</div>}>
      <EnfermeraContent />
    </Suspense>
  );
}
