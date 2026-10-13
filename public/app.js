async function mostrarEstadisticas() {
  const contentarea = document.getElementById('content-area');
  if (!contentarea) return;

  try {
    const respuesta = await fetch('/api/estadisticas');
    const stats = await respuesta.json();

    if (stats.total === 0) {
      contentarea.innerHTML = '<article><h2>Estadísticas</h2><p>Aún no hay postulantes registrados.</p></article>';
      return;
    }

    // 1. Inyectamos la estructura HTML con los <canvas>
    contentarea.innerHTML = `
      <article>
        <h2>📊 Panel de Estadísticas</h2>
        <p><strong>Total de postulantes:</strong> ${stats.total}</p>
        
        <div style="max-width: 600px; margin: 20px auto;">
          <canvas id="graficoPuestos"></canvas>
        </div>

        <div style="max-width: 600px; margin: 20px auto;">
          <canvas id="graficoNivelesJs"></canvas>
        </div>
      </article>
    `;

    // 2. Gráfico de Puestos (Gráfico de Barras)
    const ctxPuestos = document.getElementById('graficoPuestos').getContext('2d');
    new Chart(ctxPuestos, {
      type: 'bar',
      data: {
        labels: stats.puestos.map(p => p.puesto),
        datasets: [{
          label: 'Postulantes por Puesto',
          data: stats.puestos.map(p => p.cantidad),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Distribución por Puesto' }
        }
      }
    });

    // 3. Gráfico de Niveles de JS (Gráfico de Pastel o Dona)
    const ctxNiveles = document.getElementById('graficoNivelesJs').getContext('2d');
    new Chart(ctxNiveles, {
      type: 'doughnut',
      data: {
        labels: stats.nivelesJs.map(n => `Nivel ${n.nivel}`),
        datasets: [{
          label: 'Nivel de JavaScript',
          data: stats.nivelesJs.map(n => n.cantidad),
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: 'Nivel de JavaScript (%)' }
        }
      }
    });

  } catch (error) {
    console.error('Error al cargar las estadísticas:', error);
    alert('No se pudieron cargar las estadísticas.');
  }
}
