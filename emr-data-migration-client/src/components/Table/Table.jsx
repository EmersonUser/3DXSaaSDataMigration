import React, { useMemo, useState } from "react";
import  "./Table.css";

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import { unparse } from "papaparse";
 
const ReusableTable = ({ columns, data, editable = false }) => {
  const [tableData, setTableData] = useState(data);
  const [selectedRows, setSelectedRows] = useState({});
 
  const [showCheckboxes, setShowCheckboxes] = useState(false);
 
  const handleEditCell = (rowIndex, columnId, value) => {
    const updatedData = [...tableData];
    updatedData[rowIndex][columnId] = value;
    setTableData(updatedData);
  };
 
  // Toggle row selection
  const handleRowSelection = (rowId) => {
    setSelectedRows((prev) => ({
      ...prev,
      [rowId]: !prev[rowId],
    }));
  };
 
  // Enhance columns for editable functionality and combined checkbox/ID column
  const enhancedColumns = useMemo(() => {
    const checkboxColumn = {
      id: "selectOrId",
      header: () => (
        <input
          type="checkbox"
          onChange={(e) => {
            const isChecked = e.target.checked;
            setShowCheckboxes(isChecked);
 
            // Select/deselect all rows
            if (isChecked) {
              const allRowIds = Object.fromEntries(
                tableData.map((_, index) => [index, true])
              );
              setSelectedRows(allRowIds);
            } else {
              setSelectedRows({});
            }
          }}
        />
      ),
      cell: ({ row }) =>
        showCheckboxes ? (
          <input
            type="checkbox"
            checked={!!selectedRows[row.id]}
            onChange={() => handleRowSelection(row.id)}
          />
        ) : (
          row.original.id
        ),
    };
 
    const updatedColumns = [
      checkboxColumn,
      ...columns.map((column) => ({
        ...column,
        cell:
          editable && column.editable
            ? ({ row, getValue }) => (
                <input
                  value={getValue()}
                  onChange={(e) =>
                    handleEditCell(
                      row.index,
                      column.accessorKey,
                      e.target.value
                    )
                  }
                />
              )
            : column.cell,
      })),
    ];
 
    return updatedColumns;
  }, [columns, editable, selectedRows, showCheckboxes]);
 
  const table = useReactTable({
    data: tableData,
    columns: enhancedColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });
 
  const handleExportCSV = () => {
    const csv = unparse(tableData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "table-data.csv");
    link.click();
  };
 
  return (
    <div>
      <button
        onClick={handleExportCSV}
        style={{ marginBottom: "10px" }}
        className="btn btn-outline-primary btn-lg"
      >
        Export to CSV
      </button>
      <table>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  style={{ cursor: "pointer" }}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                  {header.column.getIsSorted() === "asc" ? (
                    <div>Up</div>
                  ) : header.column.getIsSorted() === "desc" ? (
                    <div>Down</div>
                  ) : (
                    ""
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              style={{
                backgroundColor: selectedRows[row.id] ? "#d5e8f2" : "inherit",
              }}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
 
export default ReusableTable;