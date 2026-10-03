import { cp, mkdir, readdir, rename, rm, stat } from 'node:fs/promises';

// Remplace le contenu de `out` par celui de `src` sans jamais laisser le site vide.
// Le nouveau site est d'abord copié dans `out/.publication` (même système de fichiers),
// puis chaque entrée de premier niveau est mise en place par renommage :
// - un fichier remplace l'ancien de façon atomique ;
// - un dossier remplace l'ancien après l'avoir écarté dans `out/.ancien`
//   (le dossier est absent pendant quelques microsecondes, contre plusieurs secondes
//   de site vide avec « rm -rf puis cp »).
// Les entrées qui n'existent plus, fichiers cachés compris, sont retirées à la fin.
const STAGE = '.publication';
const TRASH = '.ancien';

export async function publish(src, out) {
  const stage = `${out}/${STAGE}`;
  const trash = `${out}/${TRASH}`;
  await rm(stage, { recursive: true, force: true });
  await rm(trash, { recursive: true, force: true });
  await cp(src, stage, { recursive: true });
  await mkdir(trash);

  const next = new Set(await readdir(stage));
  for (const name of next) {
    const target = `${out}/${name}`;
    if ((await stat(`${stage}/${name}`)).isDirectory()) {
      await rename(target, `${trash}/${name}`).catch((e) => {
        if (e.code !== 'ENOENT') throw e;
      });
    } else if ((await stat(target).catch(() => null))?.isDirectory()) {
      await rename(target, `${trash}/${name}`);
    }
    await rename(`${stage}/${name}`, target);
  }
  for (const name of await readdir(out)) {
    if (!next.has(name) && name !== STAGE && name !== TRASH) {
      await rename(`${out}/${name}`, `${trash}/${name}`);
    }
  }
  await rm(stage, { recursive: true, force: true });
  await rm(trash, { recursive: true, force: true });
}
