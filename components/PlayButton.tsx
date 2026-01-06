import { FaPlay } from 'react-icons/fa';

const PlayButton = () => {
    return (
        <button type="submit" className="group relative flex h-14 w-fit cursor-pointer items-center rounded-full bg-primary-500 text-white shadow-lg transition-colors duration-300 ease-out hover:scale-105 hover:bg-primary-600 active:scale-95">
            {/* Text */}
            <span className="z-10 whitespace-nowrap px-7 text-xl font-bold">
                <span className="inline-block translate-x-2">Play</span>
            </span>

            {/* Icon */}
            <span className="ease-out-ml-2 -mr-2 ml-1 flex h-14 w-14 items-center justify-center rounded-full bg-primary-400 transition-transform duration-200 group-hover:bg-primary-500 group-hover:scale-105">
                <FaPlay className="text-2xl text-white transition-transform duration-200 ease-out group-hover:rotate-90" />
            </span>
        </button>
    );
};

export default PlayButton;