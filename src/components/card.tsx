import React from "react";
const Card = ({
  title,
  description,
  link,
}: {
  title: string;
  description: string;
  link?: string;
}) => {
  const cardContainer: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    backgroundColor: "grey",
    padding:"16px",
    color:"black"
  };
  const cardTitle: React.CSSProperties = {
    fontSize: "16px",
    fontWeight: 500,
  };
  const cardDescription: React.CSSProperties = {
    fontSize: "14px",
    fontWeight: 400,
  };
  return (
    <a href={link ?? "#"}>
      <div style={cardContainer}>
        <div style={cardTitle}>{title}</div>
        <div style={cardDescription}>{description}</div>
      </div>
    </a>
  );
};

export default Card;
