import Image from "next/image";
import styles from "../styles/Home.module.css";

const Logo = ({ size }) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: `${size}px`,
            height: `${size}px`,
            opacity: 1,
            position: "relative",
            marginBottom: "1rem",
            borderRadius: "30px",
            boxShadow: "0 8px 8px rgba(0, 0, 0, 0.25)",
            overflow: "hidden", // Add this to clip the image within the container
          }}
        >
          <Image
            onClick={() =>
              (window.location.href = "https://www.lawforall.co.za")
            }
            src="/logo.png"
            alt="Logo"
            width={200}
            height={200}
            className={styles.roundedLogo} // Add the class here
          />
        </div>
      </div>
    </div>
  );
};

export default Logo;
