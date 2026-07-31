import { ActionIcon, Badge, Box, Button, Group } from '@mantine/core'
import { DataTable } from 'mantine-datatable';
import { useEffect, useState } from 'react';
import type { RootUploadData } from '../types/UploadData';
import dateFormat, { masks } from "dateformat";
import {  AiOutlineDelete } from 'react-icons/ai';
import { BsCloudUpload } from "react-icons/bs";
import toast from 'react-hot-toast';
const DataViewMigration = () => {
  // get data from gobackend

  const [dataList, setdataList] = useState<RootUploadData>([])
  const [loading, setloading] = useState(false)
  const [loadingBtn, setloadingBtn] = useState(false)

  const getDataList = () => {

    setloading(true)
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;

    xhr.addEventListener("readystatechange", function () {
      if (this.readyState === 4) {
        const res: RootUploadData = JSON.parse(this.responseText)

        console.log(res);
        setdataList(res)
      }
    });

    xhr.onprogress = (pre) => {
      setloading(true)
    }

    xhr.onload = () => {
      setloading(false)
    }

    xhr.open("GET", `${import.meta.env.VITE_BACKEND_SERVER}/get-uploadlist`);

    xhr.send();
  }

  useEffect(() => {

    getDataList()

  }, [])


  return (
    <div>
      <DataTable
        withTableBorder
        borderRadius="sm"
        withColumnBorders
        striped
        highlightOnHover
        // provide data
        records={dataList}
        // define columns
        minHeight={200}

        fetching={loading && !dataList.length}
        columns={[
          {
            accessor: 'id',
            // this column has a custom title
            title: '#',
            // right-align column
            textAlign: 'right',
          },

          { accessor: 'Filename' },
          { accessor: "Status", render: (res) => {
            return (
              <>
              <Badge color={res.Status == "pending" ? "orange" : "blue"}>{res.Status}</Badge>
              </>
            )
          }},
          {
            accessor: 'created_at',
            // this column has custom cell data rendering
            render: ({ created_at }) => (
              <Box>
                {dateFormat(created_at, "fullDate")}
              </Box>
            ),
          },
          {
            accessor: 'action', render: (item) => {
              return (
                <Group>
                  <ActionIcon loading={loadingBtn} variant='default' radius={"xl"} onClick={() => {

                    var data = JSON.stringify({
                      "Filename": item.Filename
                    });

                    setloadingBtn(true)

                    var xhr = new XMLHttpRequest();
                    xhr.withCredentials = true;

                    xhr.addEventListener("readystatechange", function () {
                      if (this.readyState === 4) {
                        console.log(this.responseText);
                      }
                      getDataList()
                      toast.success("File deleted successfully")
                    });

                    xhr.onload = () => {
                      setloadingBtn(false)
                    }

                    xhr.open("DELETE", `${import.meta.env.VITE_BACKEND_SERVER}/delete`);
                    xhr.setRequestHeader("Content-Type", "application/json");

                    xhr.send(data);
                  }}><AiOutlineDelete size={20} /></ActionIcon>
                  <ActionIcon variant='default' radius={"xl"}><BsCloudUpload size={20} /></ActionIcon>
                </Group>
              )
            }
          },
        ]}

      />
    </div>
  )
}

export default DataViewMigration