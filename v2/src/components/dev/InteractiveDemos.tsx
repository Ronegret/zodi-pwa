import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Tabs } from '@/components/ui/Tabs';
import { Tooltip } from '@/components/ui/Tooltip';
import { toast } from '@/components/ui/toast';

/** Demos de los componentes interactivos para /dev/componentes. */
export function InteractiveDemos() {
  const [loading, setLoading] = useState(false);
  return (
    <div className="stack">
      <Tabs
        label="Ejemplo de pestañas"
        items={[
          { id: 'sol', label: 'Sol', content: <p>Tu identidad, sin filtros.</p> },
          { id: 'luna', label: 'Luna', content: <p>Lo que sientes cuando nadie mira.</p> },
          { id: 'asc', label: 'Ascendente', content: <p>Lo que los demás ven primero.</p> },
        ]}
      />
      <div className="chip-group">
        <Dialog
          triggerLabel="Abrir diálogo"
          title="¿Seguro?"
          confirmLabel="Sí, hazlo"
          onConfirm={() => toast('Hecho.')}
        >
          <p>Los astros no se hacen responsables de lo que pase después.</p>
        </Dialog>
        <Tooltip text="Se cierra con Esc y puedes pasar el ratón por encima.">
          <button type="button" className="btn btn-secondary">
            Con tooltip
          </button>
        </Tooltip>
        <Button onClick={() => toast('Mercurio dice hola.')}>Lanzar aviso</Button>
        <Button variant="danger" onClick={() => toast('Algo ha fallado (de mentira).', 'error')}>
          Aviso de error
        </Button>
        <Button
          variant="violet"
          loading={loading}
          onClick={() => {
            setLoading(true);
            window.setTimeout(() => setLoading(false), 1500);
          }}
        >
          Guardar (cargando)
        </Button>
      </div>
    </div>
  );
}
