# Laboratorio — instrucciones del proyecto

Repositorio personal de pruebas e investigación. No comparte código ni
dependencias con ningún otro proyecto.

---

## Comunicación

- Responder en **español**, conciso y directo, sin emojis salvo que se pidan.
- Si algo no está claro, preguntar en lugar de asumir.

---

## Cómo trabajar aquí

- Una idea nueva → archivo en `ideas/` con nombre `AAAA-MM-DD_slug.md`.
- Un experimento nuevo → carpeta en `experimentos/<slug>/` con su `README.md`
  (qué se prueba, cómo ejecutarlo, qué se ha aprendido).
- Cada experimento es independiente: sus propias dependencias, su propio
  entorno. No crear un `package.json` ni un `requirements.txt` en la raíz.
- Las notas y referencias van a `notas/`.

---

## Estilo de código

- Seguir las convenciones estándar del lenguaje que use cada experimento.
- Preferir **claridad** sobre brevedad.
- Comentarios solo donde la lógica no sea evidente.

---

## Git

- **No** commitear ni hacer push salvo que se pida; sugerir commit cuando la
  tarea esté completa.
- Mensajes en inglés, en imperativo, descriptivos.
- Rama de trabajo: `main`.

---

## Acciones destructivas

Pedir confirmación antes de borrar archivos, `git reset --hard`,
`git push --force` o cualquier operación irreversible — salvo que se haya
pedido explícitamente en el mismo mensaje.
