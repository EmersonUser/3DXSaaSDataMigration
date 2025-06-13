import React from "react";
import { useSelector } from "react-redux";
import DragAndDropComponent from "../components/DragAndDrop/DragAndDrop";
import ReusableTable from "../components/Table/Table";
import CardComponent from "../components/Card/Card";

const RevisionFloat = () => {
  // Access dragged data from Redux store
  const draggedData = useSelector((state) => state.droppedObject.draggedData);

  console.log("draggedData", draggedData);

  // Process table data
  const tableData = React.useMemo(() => {
    if (!draggedData || !draggedData.member) return [];
    return draggedData.member.map((item) => ({
      EIN: item["dseng:EnterpriseReference"]?.partNumber || "N/A",
      Title: item.title || "N/A",
      Description: item.description || "N/A",
      Type: item.type || "N/A",
      Revision: item.revision || "N/A",
      "Connected Child Revision": "N/A", // Placeholder for additional logic
      "Latest child connected": "N/A",  // Placeholder for additional logic
      "To-Be child connected": "N/A",  // Placeholder for additional logic
      State: item.state || "N/A",
      Owner: item.owner || "N/A",
      "CAD Format": "3DExperience", // Static value from your example
      Collabspace: item.collabspace || "N/A",
    }));
  }, [draggedData]);

  // Process card data
  const cardData = React.useMemo(() => {
    if (!draggedData || !draggedData.member) return [];
    return draggedData.member.map((item) => ({
      Description: item.description || "N/A",
      Type: item.type || "N/A",
      Revision: item.revision || "N/A",
      "Maturity State": item.state || "N/A",
      Owner: item.owner || "N/A",
      Collabspace: item.collabspace || "N/A",
      EIN: item["dseng:EnterpriseReference"]?.partNumber || "N/A",
      "CAD Format": "3DExperience", // Static value from your example
    }));
  }, [draggedData]);

  // Define columns for the table
  const columns = React.useMemo(() => [
    { accessorKey: "EIN", header: "EIN" },
    { accessorKey: "Title", header: "Title" },
    { accessorKey: "Description", header: "Description" },
    { accessorKey: "Type", header: "Type" },
    { accessorKey: "Revision", header: "Revision" },
    { accessorKey: "Connected Child Revision", header: "Connected Child Revision" },
    { accessorKey: "Latest child connected", header: "Latest child connected" },
    { accessorKey: "To-Be child connected", header: "To-Be child connected" },
    { accessorKey: "State", header: "State" },
    { accessorKey: "Owner", header: "Owner" },
    { accessorKey: "CAD Format", header: "CAD Format" },
    { accessorKey: "Collabspace", header: "Collabspace" },
  ], []);

  return (
    <>
      {/* Conditionally show DragAndDropComponent */}
      {(!draggedData || draggedData.length === 0) && <DragAndDropComponent />}
       {/* Display cards only if there is data */}
       {cardData.map((card, index) => (
        <CardComponent
          key={index}
          title={card.title || "Card"}
          text={`Type: ${card.Type}`}
          footerText={`Revision: ${card.Revision}, State: ${card["Maturity State"]}`}
          buttonLabel={"Details"}
          additionalInfo={{
            Owner: card.Owner,
            Collabspace: card.Collabspace,
            EIN: card.EIN,
            "CAD Format": card["CAD Format"],
          }}
        />
      ))}
      {/* Display table only if there is data */}
      {tableData.length > 0 && <ReusableTable data={tableData} columns={columns} />}
     
    </>
  );
};

export default RevisionFloat;
