import { Play, X } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface IframePlayerProps {
	src: string;
	posterSrc?: string; // Optional poster image source
	className?: string;
	options?: {
		aspectRatio?: string; // Optional aspect ratio for the iframe
		allowFullscreen?: boolean;
	};
	children?: React.ReactNode; // Add children prop to allow custom trigger content
}

export const IframePlayer: React.FC<IframePlayerProps> = ({
	src,
	posterSrc,
	className = "",
	options = {
		aspectRatio: "16/9",
		allowFullscreen: true,
	},
	children,
}) => {
	const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
	const lightboxRef = useRef<HTMLDivElement>(null);

	const closeLightbox = useCallback((): void => {
		setIsLightboxOpen(false);
	}, []);

	// Handle ESC key to close lightbox
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape" && isLightboxOpen) {
				closeLightbox();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isLightboxOpen, closeLightbox]);

	const openLightbox = (): void => {
		setIsLightboxOpen(true);
	};

	// Handle clicks outside the iframe in the lightbox to close it
	const handleLightboxClick = (e: React.MouseEvent): void => {
		if (e.target === lightboxRef.current) {
			closeLightbox();
		}
	};

	// Default trigger content if no children are provided
	const defaultTrigger = (
		<div className="h-full w-full relative group">
			<img
				src={posterSrc || `/api/placeholder/640/360`}
				alt="Content thumbnail"
				className="w-full h-full object-cover z-1"
			/>
			<div className="z-10 absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
				<button
					className="flex h-16 w-16 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 z-10"
					aria-label="Open content"
				>
					<Play size={32} />
				</button>
			</div>
		</div>
	);

	return (
		<>
			{/* Trigger that opens the lightbox - can be customized via children */}
			<div className={`cursor-pointer ${className}`} onClick={openLightbox}>
				{children || defaultTrigger}
			</div>

			{/* Lightbox - using createPortal to render outside the container */}
			{isLightboxOpen &&
				createPortal(
					<div
						ref={lightboxRef}
						className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 md:p-8 overflow-hidden"
						onClick={handleLightboxClick}
					>
						<div className="relative flex items-center justify-center overflow-hidden">
							<button
								onClick={closeLightbox}
								className="absolute right-0 top-0 md:-right-12 md:-top-12 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 z-10"
								aria-label="Close lightbox"
							>
								<X size={24} />
							</button>

							<div
								className="overflow-hidden bg-black w-full"
								style={{
									width: "80vw", // Set explicit width
									height: "80vh", // Set explicit height
									maxHeight: "80vh",
									maxWidth: "80vw",
								}}
							>
								<iframe
									src={src}
									className="w-full h-full"
									style={{
										minWidth: "640px", // Ensure minimum dimensions
										minHeight: "480px",
									}}
									frameBorder="0"
									allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
									allowFullScreen={options.allowFullscreen}
									title="Embedded content"
								/>
							</div>
						</div>
					</div>,
					document.body
				)}
		</>
	);
};
