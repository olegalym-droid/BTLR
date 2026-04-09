import { API_BASE_URL } from "./masterConstants";

export default function MasterOrderPhotos({ photos = [], onOpenPhoto }) {
  if (!photos?.length) return null;

  return (
    <div className="grid grid-cols-2 gap-2">
      {photos.map((photo) => {
        const photoUrl = `${API_BASE_URL}/${photo.file_path}`;

        return (
          <button
            key={photo.id}
            type="button"
            onClick={() => onOpenPhoto(photoUrl)}
            className="block"
          >
            <img
              src={photoUrl}
              alt="Фото заявки"
              className="h-28 w-full rounded-xl border object-cover"
            />
          </button>
        );
      })}
    </div>
  );
}
