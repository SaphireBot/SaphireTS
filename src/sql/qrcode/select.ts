// import connection from "..";

// export default function selectQrCodes() {

//   return [];
//   const sql = "SELECT * FROM qrcode LIMIT 10";

//   return connection.query(
//     sql,
//     (error, result, fields) => {
//       if (error) {
//         console.error("ERROR", error);
//         return [];
//       }

//       console.log("fields", fields);
//       return result;
//     },
//   ).start();
// }