<?php
$postData = file_get_contents('php://input');
$changes = json_decode($postData, true);
$id = $_GET['id'];

$f = fopen('data/schulen.csv', 'r');
$w = fopen('data/new.csv', 'w');
$r = fgets($f);
fwrite($w, $r);
$header = str_getcsv($r);

while ($row = fgetcsv($f)) {
  if ($row[0] === $id) {
    foreach ($changes as $k => $v) {
      $i = array_search($k, $header);
      if ($i) {
        $row[$i] = $v;
      }
    }
  }

  fputcsv($w, $row);
}

fclose($f);
fclose($w);

rename('data/new.csv', 'data/schulen.csv');
