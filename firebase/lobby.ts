import {
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "./config";
import { Player } from "@/types/player";

/* -------- PLAYER ID -------- */

export async function generatePlayerId(
  inviteCode: string
): Promise<number> {
  const snap = await getDocs(
    collection(db, "lobbies", inviteCode, "players")
  );

  return 100 + snap.size;
}

/* -------- CREATE / JOIN -------- */

export async function createLobby(inviteCode: string, host: Player) {
  await setDoc(doc(db, "lobbies", inviteCode), {
    createdAt: Date.now(),
    status: "waiting",
    hostId: host.uid,
  });

  await joinLobby(inviteCode, host);
}

export async function joinLobby(inviteCode: string, player: Player) {
  await setDoc(
    doc(db, "lobbies", inviteCode, "players", player.uid),
    {
      playerId: player.playerId,
      name: player.name,
      avatar: player.avatar,
      joinedAt: player.joinedAt,
    }
  );
}

/* -------- REALTIME LISTENER -------- */

export function listenToLobbyPlayers(
  inviteCode: string,
  callback: (players: Player[]) => void
) {
  const q = query(
    collection(db, "lobbies", inviteCode, "players"),
    orderBy("joinedAt", "asc")
  );

  return onSnapshot(q, snapshot => {
    const players: Player[] = snapshot.docs.map(doc => ({
      uid: doc.id,
      ...(doc.data() as Omit<Player, "uid">),
    }));

    callback(players);
  });
}
